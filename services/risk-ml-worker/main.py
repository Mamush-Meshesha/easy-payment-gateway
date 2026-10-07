import sys
import os
import time
import grpc
from concurrent import futures
import random

import proto.ml_pb2 as ml_pb2
import proto.ml_pb2_grpc as ml_pb2_grpc

class RiskMLService(ml_pb2_grpc.RiskMLServiceServicer):
    def EvaluateFraudProbability(self, request, context):
        print(f"[ML] Evaluating risk for IP: {request.ip_address}, Amount: {request.amount}")
        
        # Stub logic: In production this would use an XGBoost or TensorFlow model
        # loaded into memory and invoke .predict()
        
        score = 0.05 # Baseline 5% fraud probability
        risk_factors = []

        if request.amount > 1000000: # 10,000.00
            score += 0.30
            risk_factors.append("high_amount_anomaly")
        
        if request.ip_address and request.ip_address.startswith("192.168"):
             score += 0.01 # Local is fine
        else:
             score += 0.40 # Unknown external IP anomaly for stub

        if request.bin == "411111": # Test fraud BIN
            score += 0.50
            risk_factors.append("high_risk_bin")

        # Cap at 1.0
        probability_score = min(score, 1.0)
        
        print(f"[ML] Calculated Score: {probability_score}")
        
        return ml_pb2.EvaluateFraudResponse(
            probability_score=probability_score,
            risk_factors=risk_factors
        )

def serve():
    port = os.environ.get("PORT", "50068")
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    ml_pb2_grpc.add_RiskMLServiceServicer_to_server(RiskMLService(), server)
    
    server.add_insecure_port(f"[::]:{port}")
    print(f"Risk ML Worker listening on port {port}")
    server.start()
    
    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        server.stop(0)

if __name__ == '__main__':
    serve()
