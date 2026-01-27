FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (needed for some python packages)
RUN apt-get update && apt-get install -y gcc

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Ensure sqlite is sufficient

COPY . .

RUN chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]
