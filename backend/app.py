"""
PPI Predictor Backend
Flask server to load and serve the pickle model files
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import os
import logging
import joblib
import networkx as nx
import pandas as pd

DATASET_PATH = os.path.join(os.path.dirname(__file__), "PP-Pathways_ppi.csv")

df = pd.read_csv(DATASET_PATH)
df = df.iloc[:, :2]
df.columns = ["Protein1", "Protein2"]

G = nx.Graph()
G.add_edges_from(df.values)

degree = dict(G.degree())

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Path to model files
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')

# Global variables for model components
model = None
label_encoder = None
scaler = None

def load_models():
    """Load all joblib model files"""
    global model, label_encoder, scaler
    
    try:
        # Load the best model
        model_path = os.path.join(MODEL_DIR, 'ppi_best_model.pkl')
        if os.path.exists(model_path):
            model = joblib.load(model_path)
            logger.info(f"✓ Loaded model from {model_path}")
        else:
            logger.warning(f"Model file not found: {model_path}")

        # Load label encoder
        encoder_path = os.path.join(MODEL_DIR, 'ppi_label_encoder.pkl')
        if os.path.exists(encoder_path):
            label_encoder = joblib.load(encoder_path)
            logger.info(f"✓ Loaded label encoder from {encoder_path}")
        else:
            logger.warning(f"Label encoder file not found: {encoder_path}")

        # Load scaler
        scaler_path = os.path.join(MODEL_DIR, 'ppi_scaler.pkl')
        if os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
            logger.info(f"✓ Loaded scaler from {scaler_path}")
        else:
            logger.warning(f"Scaler file not found: {scaler_path}")
            
    except Exception as e:
        logger.error(f"Error loading models: {str(e)}")
        raise
    
def generate_features(p1, p2):

    p1 = int(p1)
    p2 = int(p2)

    neighbors1 = set(G.neighbors(p1)) if p1 in G else set()
    neighbors2 = set(G.neighbors(p2)) if p2 in G else set()

    cn = len(neighbors1 & neighbors2)

    union = len(neighbors1 | neighbors2)
    jaccard = cn / union if union != 0 else 0

    pa = degree.get(p1, 0) * degree.get(p2, 0)

    d1 = degree.get(p1, 0)
    d2 = degree.get(p2, 0)

    return [p1, p2, cn, jaccard, pa, d1, d2]

def predict_interaction(proteins):

    p1 = proteins[0]
    p2 = proteins[1]

    features = generate_features(p1, p2)

    X = np.array(features).reshape(1, -1)

    if scaler:
        X = scaler.transform(X)

    pred = model.predict(X)[0]

    if hasattr(model, "predict_proba"):
        confidence = model.predict_proba(X)[0][1]
    else:
        confidence = 0.85

    return bool(pred), float(confidence), "Prediction using graph-based PPI model"

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'scaler_loaded': scaler is not None,
        'encoder_loaded': label_encoder is not None
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    """Prediction endpoint"""
    try:
        data = request.get_json()
        
        if not data or 'proteins' not in data:
            return jsonify({'error': 'Missing proteins data'}), 400
        
        proteins = data['proteins']
        
        if len(proteins) < 2:
            return jsonify({'error': 'At least 2 protein sequences required'}), 400
        
        # Validate sequences
        for protein in proteins:
            seq = protein.get('sequence', '').strip()

            if not seq.isdigit():
                return jsonify({'error': f"Protein ID must be numeric for {protein.get('name','protein')}"})
        
        # Make prediction
        sequences = [p['sequence'] for p in proteins]
        is_interacting, confidence, details = predict_interaction(sequences)
        
        return jsonify({
            'interacting': is_interacting,
            'confidence': confidence,
            'protein1': proteins[0]['name'],
            'protein2': proteins[1]['name'],
            'details': details
        })
        
    except Exception as e:
        logger.error(f"API error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/model-info', methods=['GET'])
def model_info():
    """Get model information"""
    return jsonify({
        'model_loaded': model is not None,
        'scaler_loaded': scaler is not None,
        'encoder_loaded': label_encoder is not None,
        'model_type': type(model).__name__ if model else None,
        'model_dir': MODEL_DIR,
        'available_files': os.listdir(MODEL_DIR) if os.path.exists(MODEL_DIR) else []
    })

# Serve static files (React app)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_static(path):
    """Serve static files from the dist folder"""
    static_dir = os.path.join(os.path.dirname(__file__), '..', 'dist')
    
    if path == "":
        return app.send_static_file('index.html')
    
    file_path = os.path.join(static_dir, path)
    if os.path.exists(file_path):
        return app.send_static_file(path)
    else:
        return app.send_static_file('index.html')

if __name__ == '__main__':
    # Create models directory if it doesn't exist
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    # Load models on startup
    load_models()
    
    # Run the server
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
