FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required for opencv-python-headless (used by rembg/pillow)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose the port defined in server_birefnet.py
EXPOSE 8001

# Run the server
CMD ["python", "server_birefnet.py"]
