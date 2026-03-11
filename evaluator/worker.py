# -*- coding: utf-8 -*-
import os
import time
import requests
import json
from dotenv import load_dotenv
from engine.feature_extractor import FeatureExtractor
from engine.scorer import Scorer
from utils.data_handler import DataHandler
from tqdm import tqdm

load_dotenv()

# Configuration
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:4000")

def run_worker_loop():
    print(f"🔄 Worker döngüsü başlatıldı. Backend: {BACKEND_URL}")
    
    # Bileşenleri yükle
    basic, advanced = DataHandler.load_knowledge_components()
    extractor = FeatureExtractor(basic_terms=basic, advanced_terms=advanced)
    scorer = Scorer()
    
    while True:
        try:
            # 1. İş Claim Et
            print("🔍 Bekleyen iş taranıyor...")
            response = requests.post(f"{BACKEND_URL}/batch/jobs/claim", timeout=10)
            response.raise_for_status()
            job_data = response.json().get("job")
            
            if not job_data:
                # Bekleyen iş yoksa biraz bekle ve tekrar dene
                time.sleep(15)
                continue
                
            job_id = job_data["id"]
            print(f"🚀 İş alındı: {job_id}")
            
            # 2. Mesajları Getir
            msg_response = requests.get(f"{BACKEND_URL}/batch/jobs/{job_id}/messages", timeout=30)
            msg_response.raise_for_status()
            messages = msg_response.json().get("messages", [])
            
            print(f"📩 {len(messages)} mesaj bulundu. Analiz başlıyor...")
            
            # 3. Mesajları Analiz Et ve Gönder
            student_messages = [m for m in messages if m["is_user"]]
            
            for msg in tqdm(student_messages, desc=f"İş {job_id}"):
                features = extractor.extract_features(msg["message"])
                
                # İçerik Puanlama
                content_res = scorer.score_with_llm(msg["message"], features, "content")
                # Diyalog Puanlama
                dialog_res = scorer.score_with_llm(msg["message"], features, "dialog")
                
                # Sonucu gönder
                eval_payload = {
                    "messageId": msg["id"],
                    "jobId": job_id,
                    "scores": {
                        "content": content_res["score"],
                        "dialog": dialog_res["score"],
                        "content_reasoning": content_res.get("reasoning"),
                        "dialog_reasoning": dialog_res.get("reasoning"),
                        "features": features
                    },
                    "feedback": content_res.get("reasoning")
                }
                
                res = requests.post(f"{BACKEND_URL}/batch/evaluate", json=eval_payload, timeout=10)
                res.raise_for_status()
            
            # 4. İş Durumunu Tamamlandı Yap
            requests.patch(f"{BACKEND_URL}/batch/jobs/{job_id}/status", json={
                "id": job_id,
                "status": "completed"
            }, timeout=10)
            print(f"✅ İş başarıyla tamamlandı: {job_id}")
            
        except Exception as e:
            print(f"❌ Worker hatası: {str(e)}")
            time.sleep(10)

if __name__ == "__main__":
    run_worker_loop()
