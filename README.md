# Snapgrade!

## Development Setup

### RAG MCP Tools Setup

1. Ensure Python 3.8+ is installed and in your system PATH:

   ```bash
   python --version
   ```

2. Create Python virtual environment:

   ```bash
   cd rag-mcp
   python -m venv venv
   ```

3. Activate virtual environment:

   - Windows: `.\venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`

4. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

5. Verify installation:
   ```bash
   python docs_mcp_server.py --version
   ```
