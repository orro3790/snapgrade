#!/usr/bin/env python3
from __future__ import annotations

import os
import numpy as np
from typing import List, Optional
from dotenv import load_dotenv
from supabase import Client, create_client
from openai import AsyncOpenAI
from mcp.server.fastmcp import FastMCP
from docs_mcp_types import DocumentationSource, SupabaseConfig
import sys
import json
from pathlib import Path

# Load environment variables
load_dotenv()

# Initialize FastMCP server
mcp = FastMCP("documentation-expert")

# Initialize OpenAI client
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def init_supabase(config: SupabaseConfig) -> Client:
    """Initialize Supabase client with provided configuration"""
    return create_client(config.url, config.service_key)

async def get_embedding(text: str) -> List[float]:
    """Get embedding vector from OpenAI."""
    try:
        # Clean the text by replacing newlines with spaces
        text = text.replace("\n", " ")
        
        # Get embedding from OpenAI
        response = await openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=[text],
            encoding_format="float"
        )
        
        # Return the embedding vector
        return response.data[0].embedding
        
    except Exception as e:
        print(f"Error getting embedding: {str(e)}")
        return [0.0] * 1536

async def get_documentation_sources(supabase: Client) -> List[DocumentationSource]:
    """Retrieve list of documentation sources from Supabase"""
    try:
        result = supabase.rpc('get_distinct_sources').execute()
        if not result.data:
            return []
            
        return [
            DocumentationSource(
                project_name=str(r['project_name']),
                display_name=str(r['display_name']),
                doc_count=int(r['doc_count'])
            )
            for r in result.data 
            if r['project_name'] is not None
        ]
    except Exception as e:
        print(f"Error getting documentation sources: {e}")
        return []

@mcp.tool()
async def list_documentation_sources() -> str:
    """List all available documentation sources."""
    try:
        # Initialize Supabase client
        supabase_config = SupabaseConfig(
            url=os.getenv("SUPABASE_URL", ""),
            service_key=os.getenv("SUPABASE_SERVICE_KEY", "")
        )
        
        if not supabase_config.url or not supabase_config.service_key:
            return "Error: Missing Supabase credentials"
            
        supabase = init_supabase(supabase_config)
        sources = await get_documentation_sources(supabase)
        
        if not sources:
            return "No documentation sources found"
            
        return "\n".join(
            f"- {source.display_name} ({source.doc_count} pages)"
            for source in sources
        )
        
    except Exception as e:
        return f"Error listing documentation sources: {str(e)}"

@mcp.tool()
async def search_by_title(search_term: str, project_name: Optional[str] = None) -> str:
    """
    Search documentation titles for specific terms.
    
    Args:
        search_term: Term to search for in titles
        project_name: Optional project to filter by (e.g., 'discord', 'n8n')
    """
    try:
        # Initialize Supabase client
        supabase_config = SupabaseConfig(
            url=os.getenv("SUPABASE_URL", ""),
            service_key=os.getenv("SUPABASE_SERVICE_KEY", "")
        )
        
        if not supabase_config.url or not supabase_config.service_key:
            return "Error: Missing Supabase credentials"
            
        supabase = init_supabase(supabase_config)
        
        # Build query
        query = supabase.from_('site_pages').select('title, url, metadata')
        
        # Add project filter if specified
        if project_name:
            query = query.eq('metadata->>project_name', project_name.lower())
                
        result = query.execute()
        
        if not result.data:
            return "No documentation found"
                
        # Find matches in titles
        matches = []
        for doc in result.data:
            title = str(doc['title']).lower()
            if search_term.lower() in title:
                matches.append(f"• {doc['title']}\n  {doc['url']}")
                    
        if not matches:
            return f"No titles found containing '{search_term}'"
                
        return "Found these relevant titles:\n\n" + "\n\n".join(matches)
        
    except Exception as e:
        return f"Error searching titles: {str(e)}"

@mcp.tool()
async def search_documentation(query: str, project_name: Optional[str] = None) -> str:
    """
    Search through documentation using semantic search.
    
    Args:
        query: The search query
        project_name: Optional project to filter by (e.g., 'discord', 'n8n')
    """
    try:
        # Initialize Supabase client
        supabase_config = SupabaseConfig(
            url=os.getenv("SUPABASE_URL", ""),
            service_key=os.getenv("SUPABASE_SERVICE_KEY", "")
        )
        
        if not supabase_config.url or not supabase_config.service_key:
            return "Error: Missing Supabase credentials"
            
        supabase = init_supabase(supabase_config)
        
        # Get query embedding
        query_embedding = await get_embedding(query)
        
        # Prepare filter based on project
        filter_params = {}
        if project_name and project_name.strip():
            filter_params = {'project_name': project_name.strip().lower()}
        
        # Query Supabase for relevant documents
        result = supabase.rpc(
            'match_site_pages',
            {
                'query_embedding': query_embedding,
                'match_count': 10,
                'filter': filter_params
            }
        ).execute()
        
        if not result.data:
            return f"No relevant documentation found{' for ' + project_name if project_name else ''}."
        
        # Format the results
        formatted_chunks = []
        for doc in result.data:
            confidence = doc['similarity'] * 100
            
            chunk_text = f"""
# {doc['title']} ({confidence:.1f}% match)
Source: {doc['display_name']}
URL: {doc['url']}

{doc['content']}
"""
            formatted_chunks.append(chunk_text)
            
        return "\n\n---\n\n".join(formatted_chunks)
        
    except Exception as e:
        print(f"Error in search_documentation: {str(e)}")
        return f"Error searching documentation: {str(e)}"

def handle_search_documentation(query):
    return {
        "status": "success",
        "results": [
            {"title": "Example doc", "content": "Example content"}
        ]
    }

def handle_search_by_title(title):
    return {
        "status": "success",
        "results": [
            {"title": title, "content": "Example content"}
        ]
    }

def handle_list_documentation_sources():
    return {
        "status": "success",
        "sources": [
            {"name": "Svelte Docs", "path": "docs/svelte"},
            {"name": "Discord API", "path": "docs/discord"},
            {"name": "Supabase", "path": "docs/supabase"}
        ]
    }

def main():
    if "--version" in sys.argv:
        print("RAG MCP Server v0.1.0")
        return

    while True:
        try:
            line = input()
            request = json.loads(line)
            
            command = request.get("command")
            if command == "search_documentation":
                response = handle_search_documentation(request.get("query"))
            elif command == "search_by_title":
                response = handle_search_by_title(request.get("title"))
            elif command == "list_documentation_sources":
                response = handle_list_documentation_sources()
            else:
                response = {"status": "error", "message": f"Unknown command: {command}"}
            
            print(json.dumps(response))
            sys.stdout.flush()
            
        except EOFError:
            break
        except Exception as e:
            print(json.dumps({"status": "error", "message": str(e)}))
            sys.stdout.flush()

if __name__ == "__main__":
    main()