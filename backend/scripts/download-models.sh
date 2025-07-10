#!/bin/bash

# Create the models directory if it doesn't exist
mkdir -p ./volumes/models

# Function to download a model if it doesn't exist
download_model() {
    local model_name=$1
    local model_url=$2
    local output_path=$3

    if [ ! -f "$output_path" ]; then
        echo "Downloading $model_name..."
        wget -O "$output_path" "$model_url"
    else
        echo "$model_name already exists at $output_path"
    fi
}

# Choose which model to download
echo "Select a model to download:"
echo "1) InternVL3-1B-Instruct (Recommended for better quality)"
echo "2) SmolVLM-500M-Instruct (Smaller and faster)"
read -p "Enter your choice (1 or 2): " model_choice

case $model_choice in
    1)
        # Download InternVL3-1B-Instruct
        MODEL_NAME="InternVL3-1B-Instruct"
        MODEL_URL="https://huggingface.co/ggml-org/InternVL3-1B-Instruct-GGUF/resolve/main/InternVL3-1B-Instruct-Q8_0.gguf"
        MMPROJ_URL="https://huggingface.co/ggml-org/InternVL3-1B-Instruct-GGUF/resolve/main/mmproj-InternVL3-1B-Instruct-Q8_0.gguf"
        ;;
    2)
        # Download SmolVLM-500M-Instruct
        MODEL_NAME="SmolVLM-500M-Instruct"
        MODEL_URL="https://huggingface.co/ggml-org/SmolVLM-500M-Instruct-GGUF/resolve/main/SmolVLM-500M-Instruct-Q8_0.gguf"
        MMPROJ_URL="https://huggingface.co/ggml-org/SmolVLM-500M-Instruct-GGUF/resolve/main/mmproj-SmolVLM-500M-Instruct-Q8_0.gguf"
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Download model files
MODEL_PATH="./volumes/models/model.gguf"
MMPROJ_PATH="./volumes/models/model_mmproj.gguf"

download_model "$MODEL_NAME (Main Model)" "$MODEL_URL" "$MODEL_PATH"
download_model "$MODEL_NAME (Vision Encoder)" "$MMPROJ_URL" "$MMPROJ_PATH"

echo "Model download complete!"
echo "You can now run the llama-server using docker-compose:"
echo "docker-compose up -d llama-server" 