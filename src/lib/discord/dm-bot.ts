// src/lib/discord/dm-bot.ts
import { 
    Client, 
    IntentsBitField, 
    Events, 
    DMChannel,
    ApplicationCommandType,
    CommandInteraction
  } from 'discord.js';
  import { z } from 'zod';
  import type { DocumentStatus } from '$lib/schemas/document';
  
  const envSchema = z.object({
    DISCORD_TOKEN: z.string(),
    DISCORD_CLIENT_ID: z.string(),
  });
  
  type DiscordConfig = z.infer<typeof envSchema>;
  
  export class DiscordDMBot {
    private client: Client;
    private config: DiscordConfig;
  
    constructor(config: DiscordConfig) {
      this.config = envSchema.parse(config);
  
      // Initialize Discord client with DM-specific intents
      this.client = new Client({
        intents: [
          IntentsBitField.Flags.Guilds,
          IntentsBitField.Flags.GuildMessages,
          IntentsBitField.Flags.DirectMessages,
          IntentsBitField.Flags.DirectMessageReactions,
          IntentsBitField.Flags.MessageContent,
        ]
      });
  
      this.setupEventHandlers();
      this.registerCommands();
    }
  
    private async registerCommands(): Promise<void> {
      // Register global slash commands
      const commands = [
        {
          name: 'start',
          description: 'Start a new grading session in DMs',
          type: ApplicationCommandType.ChatInput,
        },
        {
          name: 'help',
          description: 'Get help on how to use the grading bot',
          type: ApplicationCommandType.ChatInput,
        }
      ];
  
      try {
        await this.client.application?.commands.set(commands);
      } catch (error) {
        console.error('Error registering commands:', error);
      }
    }
  
    private setupEventHandlers(): void {
      // Handle ready event
      this.client.on(Events.ClientReady, () => {
        console.log('Discord DM bot is ready!');
      });
  
      // Handle direct messages
      this.client.on(Events.MessageCreate, async (message) => {
        // Only process DMs and ignore bot messages
        if (!message.channel.isDMBased() || message.author.bot) return;
  
        // Handle file uploads in DMs
        if (message.attachments.size > 0) {
          await this.handleFileUploads(message);
        }
      });
  
      // Handle slash commands
      this.client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
  
        switch (interaction.commandName) {
          case 'start':
            await this.handleStartCommand(interaction);
            break;
          case 'help':
            await this.handleHelpCommand(interaction);
            break;
        }
      });
    }
  
    private async handleStartCommand(interaction: CommandInteraction): Promise<void> {
      try {
        // Create or get DM channel
        const dmChannel = await interaction.user.createDM();
        
        await dmChannel.send({
          content: `Welcome to Snapgrade! 📚\n\n`
            + `I'm your personal grading assistant. You can upload student essays `
            + `directly to this chat and I'll help you process them.\n\n`
            + `Simply drag and drop or upload any essay (JPG, PNG, or PDF) `
            + `and I'll convert it to text for grading.`
        });
  
        // Reply to the original interaction
        await interaction.reply({
          content: "I've sent you a DM! 📬",
          ephemeral: true
        });
      } catch (error) {
        console.error('Error handling start command:', error);
        await interaction.reply({
          content: "There was an error starting the DM session. Please make sure you allow DMs from server members.",
          ephemeral: true
        });
      }
    }
  
    private async handleHelpCommand(interaction: CommandInteraction): Promise<void> {
      await interaction.reply({
        content: `**How to use Snapgrade:**\n\n`
          + `1. Use \`/start\` to begin a grading session in DMs\n`
          + `2. Upload student essays as images or PDFs\n`
          + `3. I'll process them and prepare them for grading\n\n`
          + `Supported file types: JPG, PNG, PDF`,
        ephemeral: true
      });
    }
  
    private async handleFileUploads(message: Message): Promise<void> {
      const validFiles = message.attachments.filter(attachment => 
        this.isValidFile(attachment.name)
      );
  
      if (validFiles.size === 0) {
        await message.reply(
          "Sorry, I can only process JPG, PNG, or PDF files. Please try again with a supported file type."
        );
        return;
      }
  
      // Process each valid file
      for (const [, attachment] of validFiles) {
        try {
          // Send processing status
          const statusMessage = await message.channel.send(
            `Processing ${attachment.name}... ⏳`
          );
  
          // Process the file
          await this.processFile(attachment.url, {
            userId: message.author.id,
            messageId: message.id,
            fileName: attachment.name
          });
  
          // Update status
          await statusMessage.edit(
            `✅ ${attachment.name} has been processed and is ready for grading!`
          );
        } catch (error) {
          console.error(`Error processing file ${attachment.name}:`, error);
          await message.channel.send(
            `❌ Sorry, there was an error processing ${attachment.name}. Please try again.`
          );
        }
      }
    }
  
    private isValidFile(filename: string): boolean {
      const validExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
      return validExtensions.some(ext => 
        filename.toLowerCase().endsWith(ext)
      );
    }
  
    private async processFile(
      fileUrl: string,
      metadata: {
        userId: string;
        messageId: string;
        fileName: string;
      }
    ): Promise<void> {
      // Download file
      const response = await fetch(fileUrl);
      const fileBuffer = await response.arrayBuffer();
  
      // Create document in staging status
      const document = {
        status: 'staged' as DocumentStatus,
        sourceType: 'discord' as const,
        sourceMetadata: {
          discordUserId: metadata.userId,
          discordMessageId: metadata.messageId,
          discordFileUrl: fileUrl,
          fileName: metadata.fileName
        },
        // Add other required document fields here
      };
  
      // TODO: Integrate with LLMWhisperer for OCR processing
      // This would replace your current Discord processing logic
    }
  
    async start(): Promise<void> {
      try {
        await this.client.login(this.config.DISCORD_TOKEN);
      } catch (error) {
        console.error('Failed to start Discord bot:', error);
        throw error;
      }
    }
  
    async stop(): Promise<void> {
      this.client.destroy();
    }
  }