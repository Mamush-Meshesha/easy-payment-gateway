#!/bin/bash
set -e

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

# Generate Protobufs
python3 -m grpc_tools.protoc -I../../packages/protobuf/src \
    --python_out=./proto \
    --grpc_python_out=./proto \
    ../../packages/protobuf/src/ml.proto

# Fix python import paths for generated grpc code
sed -i 's/^import ml_pb2 as ml__pb2/from . import ml_pb2 as ml__pb2/' ./proto/ml_pb2_grpc.py

echo "Build complete."
