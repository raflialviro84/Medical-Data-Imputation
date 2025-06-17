from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import skfuzzy as fuzz
import tempfile
import os
import random
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/impute-fcm")
async def impute_fcm(
    file: UploadFile = File(...),
    n_clusters: int = Form(5),
    m: float = Form(2.0),
    test_fraction: float = Form(0.1)  # default 10% data untuk evaluasi
):
    tmp_path = None
    mask_indices = []
    original_values = {}
    try:
        # Simpan file upload ke file sementara
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file.filename.split('.')[-1]}') as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        # Baca data (support xlsx, xls, csv)
        ext = file.filename.split('.')[-1].lower()
        try:
            if ext == 'csv':
                df = pd.read_csv(tmp_path)
            else:
                df = pd.read_excel(tmp_path)
        except Exception as e:
            return JSONResponse(status_code=400, content={"error": f"Failed to read file: {str(e)}"})
        if df.empty:
            return JSONResponse(status_code=400, content={"error": "File is empty or not readable."})
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) == 0:
            return JSONResponse(status_code=400, content={"error": "No numeric columns found in the file. Fuzzy C-Means requires numeric data."})
        if df[numeric_cols].isnull().all().all():
            return JSONResponse(status_code=400, content={"error": "All numeric columns are completely missing. Cannot perform imputation."})
        if n_clusters >= len(df):
            return JSONResponse(status_code=400, content={"error": f"Number of clusters (n_clusters={n_clusters}) must be less than number of rows ({len(df)})."})
        if not (1.1 <= m <= 5):
            return JSONResponse(status_code=400, content={"error": "Parameter m must be between 1.1 and 5."})
        # Warning jika ada kolom/row missing >80%
        warn_cols = [col for col in numeric_cols if df[col].isnull().mean() > 0.8]
        warn_rows = df.index[df[numeric_cols].isnull().mean(axis=1) > 0.8].tolist()
        # Pilih subset data untuk evaluasi (masking) SEBELUM imputasi
        if 0 < test_fraction < 1:
            for col in numeric_cols:
                col_indices = df[df[col].notnull()].index.tolist()
                n_mask = max(1, int(len(col_indices) * test_fraction))
                mask_idx = random.sample(col_indices, n_mask) if len(col_indices) > n_mask else col_indices
                mask_indices.extend([(i, col) for i in mask_idx])
            # Simpan nilai asli
            original_values = {(i, col): df.loc[i, col] for (i, col) in mask_indices}
            # Masking
            for (i, col) in mask_indices:
                df.loc[i, col] = np.nan
        # Imputasi FCM dilakukan pada df yang sudah dimask
        data = df.copy()
        data[numeric_cols] = data[numeric_cols].fillna(data[numeric_cols].mean())
        data_array = data[numeric_cols].to_numpy().T.astype(float)
        cntr, u, u0, d, jm, p, fpc = fuzz.cluster.cmeans(
            data_array, c=n_clusters, m=m, error=0.005, maxiter=1000, init=None
        )
        df_filled = df.copy()
        for idx in range(len(df)):
            row = df.iloc[idx]
            missing_cols = row[row.isnull()].index
            if len(missing_cols) > 0:
                cluster = np.argmax(u[:, idx])
                for col in missing_cols:
                    if col in numeric_cols:
                        col_idx = numeric_cols.get_loc(col)
                        df_filled.loc[idx, col] = cntr[cluster, col_idx]
        # Fallback: isi sisa missing di kolom numerik dengan median (atau 0 jika median NaN)
        for col in numeric_cols:
            if df_filled[col].isnull().any():
                median_val = df_filled[col].median()
                df_filled[col] = df_filled[col].fillna(median_val if not np.isnan(median_val) else 0)
        # Evaluasi imputasi jika masking dilakukan
        eval_result = None
        if 0 < test_fraction < 1:
            if mask_indices:
                y_true = np.array([original_values[(i, col)] for (i, col) in mask_indices])
                y_pred = np.array([df_filled.loc[i, col] for (i, col) in mask_indices])
                mae = float(np.mean(np.abs(y_true - y_pred)))
                rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
                eval_result = {"mae": mae, "rmse": rmse, "n_test": len(mask_indices)}
            else:
                eval_result = {"mae": 0.0, "rmse": 0.0, "n_test": 0}
        # Simpan hasil imputasi ke file sementara (format sama dengan input)
        if ext == 'csv':
            out_path = tmp_path.replace(f'.{ext}', '_filled.csv')
            df_filled.to_csv(out_path, index=False)
            download_name = 'Blood_Sample_filled.csv'
        else:
            out_path = tmp_path.replace(f'.{ext}', '_filled.xlsx')
            df_filled.to_excel(out_path, index=False)
            download_name = 'Blood_Sample_filled.xlsx'
        response = FileResponse(out_path, filename=download_name)
        # Pastikan header evaluasi dikirim dalam format JSON agar mudah diparse frontend
        if eval_result:
            response.headers["X-Imputation-Eval"] = json.dumps(eval_result)
        # Expose header agar bisa dibaca frontend (CORS)
        response.headers["Access-Control-Expose-Headers"] = "X-Imputation-Eval, X-Warning"
        # Tambahkan warning jika ada kolom/row missing >80%
        if warn_cols or warn_rows:
            response.headers["X-Warning"] = f"Highly missing columns: {','.join(warn_cols)}; Highly missing rows: {len(warn_rows)}"
        return response
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
