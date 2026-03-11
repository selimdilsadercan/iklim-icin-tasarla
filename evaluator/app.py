from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import shutil
import os
from pathlib import Path
import tempfile

from utils.data_handler import DataHandler
from engine.feature_extractor import FeatureExtractor
from engine.scorer import Scorer
from reports.generator import ReportGenerator
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Iklim-Eval Analiz API",
    description="Öğrenci mesajlarını analiz eden ve pedagojik rapor oluşturan servis",
    version="1.0.0"
)

# Servis bileşenlerini tek seferde başlat (Performans için)
basic_terms, advanced_terms = DataHandler.load_knowledge_components()
extractor = FeatureExtractor(basic_terms=basic_terms, advanced_terms=advanced_terms)
scorer = Scorer()
reporter = ReportGenerator(scorer)

@app.get("/")
def read_root():
    return {"status": "online", "message": "Iklim-Eval API çalışıyor.", "worker_running": worker_running}

worker_running = False

@app.post("/worker/start")
async def start_worker(background_tasks: BackgroundTasks):
    global worker_running
    if worker_running:
        return {"status": "already_running"}
    
    from worker import run_worker_loop
    background_tasks.add_task(run_worker_loop)
    worker_running = True
    return {"status": "started"}

@app.post("/analyze")
async def analyze_csv(file: UploadFile = File(...)):
    """
    Bir öğrenci CSV'sini analiz eder ve JSON raporu döner.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Lütfen geçerli bir CSV dosyası yükleyin.")

    # 1. Dosyayı geçici bir yere kaydet
    with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        # 2. Veri Yükleme (DataHandler bizden dosya yolu bekler)
        # Not: DataHandler.load_student_csv dosya isminden öğrenci adını çeker.
        # file.filename'i kullanarak bu ismi koruyalım.
        
        # Orijinal dosya adını kullanarak geçici dosyayı yeniden adlandıralım ki DataHandler ismi bulabilsin
        final_tmp_path = os.path.join(tempfile.gettempdir(), file.filename)
        shutil.move(tmp_path, final_tmp_path)
        
        df, student_name = DataHandler.load_student_csv(final_tmp_path)
        meta = DataHandler.parse_metadata_from_path(final_tmp_path)

        # 3. Analiz (Etiketleme)
        student_indices = df[df['Sender'] == 'student'].index
        df['content_label'] = None
        df['dialog_label'] = None
        
        for idx in student_indices:
            message = str(df.loc[idx, 'Message'])
            features = extractor.extract_features(message)
            
            c_res = scorer.score_with_llm(message, features, "content")
            df.at[idx, 'content_label'] = c_res['score']
            
            d_res = scorer.score_with_llm(message, features, "dialog")
            df.at[idx, 'dialog_label'] = d_res['score']

        # 4. Rapor Oluşturma
        report = reporter.generate_final_report(df, student_name, meta)
        
        # Temizlik
        os.remove(final_tmp_path)
        
        return report

    except Exception as e:
        if os.path.exists(tmp_path): os.remove(tmp_path)
        raise HTTPException(status_code=500, detail=f"Analiz sırasında bir hata oluştu: {str(e)}")

# API'yi başlatmak için: uvicorn app:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
