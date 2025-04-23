#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print colored messages
print_message() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}==>${NC} $1"
}

print_error() {
    echo -e "${RED}==>${NC} $1"
}

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Update system
print_message "Updating system packages..."
apt update && apt upgrade -y

# Install Node.js and npm
print_message "Installing Node.js and npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install git
print_message "Installing git..."
apt install -y git

# Create project directory
PROJECT_DIR="/opt/spooftube-sender"
print_message "Creating project directory at ${PROJECT_DIR}..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Clone the repository
print_message "Cloning project repository..."
git clone https://github.com/yourusername/spooftube-sender.git .

# Install project dependencies
print_message "Installing project dependencies..."
npm install

# Create .env file
print_message "Setting up environment variables..."
echo "Please provide the following information:"

# Get Telegram Bot Token
echo -n "Enter your Telegram Bot Token (from @BotFather): "
read -r BOT_TOKEN

# Get WebApp URL
echo -n "Enter your WebApp URL (e.g., https://your-app.netlify.app): "
read -r WEBAPP_URL

# Get Infura URL
echo -n "Enter your Infura URL (https://mainnet.infura.io/v3/your-project-id): "
read -r INFURA_URL

# Create .env file
cat > .env << EOL
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=${BOT_TOKEN}
WEBAPP_URL=${WEBAPP_URL}

# Blockchain Configuration
INFURA_URL=${INFURA_URL}
EOL

# Set proper permissions
chown -R $(logname):$(logname) $PROJECT_DIR
chmod 600 .env

# Install PM2 for process management
print_message "Installing PM2 process manager..."
npm install -g pm2

# Build the project
print_message "Building the project..."
npm run build

# Create systemd service
print_message "Creating systemd service..."
cat > /etc/systemd/system/spooftube-sender.service << EOL
[Unit]
Description=SpoofTube Sender Bot
After=network.target

[Service]
Type=simple
User=$(logname)
WorkingDirectory=${PROJECT_DIR}
ExecStart=/usr/bin/pm2 start npm --name "spooftube-sender" -- run bot
Restart=always

[Install]
WantedBy=multi-user.target
EOL

# Enable and start the service
systemctl enable spooftube-sender
systemctl start spooftube-sender

print_success "Installation completed successfully!"
print_success "The bot is now running as a system service"
print_message "You can check the status with: systemctl status spooftube-sender"
print_message "View logs with: journalctl -u spooftube-sender"

# Final instructions
echo
print_message "Important next steps:"
echo "1. Test your bot by messaging it on Telegram"
echo "2. Configure webhook URL in BotFather if needed"
echo "3. Monitor the logs for any issues"
echo
print_success "Thank you for installing SpoofTube Sender!"