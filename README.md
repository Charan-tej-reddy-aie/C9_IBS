# PPI Predictor - Protein-Protein Interaction Web Application

A modern web application for predicting protein-protein interactions using your trained machine learning models saved as `.pkl` files.

![PPI Predictor](https://your-screenshot-url.png)

## Features

- **Interactive Input Interface**: Enter 2+ protein sequences with validation
- **Animated Waiting State**: DNA helix animation with pulsing molecules while predicting
- **Color-Coded Results**: 
  - Green glow + checkmark for **Interactive** proteins
  - Red glow + X mark for **Non-Interactive** proteins
- **Model Status Indicator**: Shows which pickle files are loaded
- **Confidence Score**: Displays prediction reliability percentage

## Project Structure

```
app/
├── backend/              # Python Flask backend
│   ├── app.py           # Main Flask application
│   ├── requirements.txt # Python dependencies
│   └── models/          # Place your .pkl files here
│       ├── ppi_best_model.pkl
│       ├── ppi_label_encoder.pkl
│       └── ppi_scaler.pkl
├── src/
│   └── sections/
│       └── PPIPredictor.tsx  # Main React component
├── dist/                # Built frontend files
└── README.md
```

## Setup Instructions

### 1. Place Your Model Files

Copy your `.pkl` files to the `backend/models/` directory:

```bash
mkdir -p backend/models
cp /path/to/your/ppi_best_model.pkl backend/models/
cp /path/to/your/ppi_label_encoder.pkl backend/models/
cp /path/to/your/ppi_scaler.pkl backend/models/
```

### 2. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Run the Backend Server

```bash
python app.py
```

The backend will start on `http://localhost:5000`

You should see output like:
```
✓ Loaded model from .../backend/models/ppi_best_model.pkl
✓ Loaded label encoder from .../backend/models/ppi_label_encoder.pkl
✓ Loaded scaler from .../backend/models/ppi_scaler.pkl
```

### 4. Configure Frontend (if needed)

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` if your backend runs on a different port:
```
VITE_API_URL=http://localhost:5000
```

### 5. Install Frontend Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

### 7. Build for Production

```bash
npm run build
```

This creates optimized files in the `dist/` folder.

## API Endpoints

### Health Check
```
GET /api/health
```
Returns server and model status.

### Model Info
```
GET /api/model-info
```
Returns information about loaded models.

### Predict
```
POST /api/predict
Content-Type: application/json

{
  "proteins": [
    { "name": "Protein A", "sequence": "MKTAYIA..." },
    { "name": "Protein B", "sequence": "GSHSMRY..." }
  ]
}
```

Returns:
```json
{
  "interacting": true,
  "confidence": 0.9234,
  "protein1": "Protein A",
  "protein2": "Protein B",
  "details": "Prediction based on sequence analysis..."
}
```

## Customizing Feature Extraction

The backend includes a placeholder `extract_features()` function. **You need to replace this with your actual feature extraction logic** that matches how your model was trained.

Edit `backend/app.py` and update the `extract_features()` function:

```python
def extract_features(sequence):
    """
    Extract features from protein sequence.
    Replace this with your actual feature extraction code.
    """
    # Your feature extraction logic here
    # Must return a numpy array with the same number of features
    # that your model expects
    
    features = []
    # ... your code ...
    return np.array(features)
```

## Deployment

### Option 1: Deploy Backend and Frontend Separately

1. **Backend**: Deploy `backend/app.py` to a Python hosting service (Heroku, Railway, AWS, etc.)
2. **Frontend**: Deploy the `dist/` folder to a static hosting service (Vercel, Netlify, GitHub Pages)
3. Update `VITE_API_URL` to point to your deployed backend

### Option 2: Single Server Deployment

The Flask app can serve both the API and static files:

```python
# In app.py, the static files are already configured
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_static(path):
    static_dir = os.path.join(os.path.dirname(__file__), '..', 'dist')
    # ...
```

Build the frontend and copy `dist/` next to `backend/`, then run:

```bash
gunicorn -w 4 -b 0.0.0.0:5000 backend.app:app
```

## Troubleshooting

### Model Not Loading
- Check that `.pkl` files are in `backend/models/`
- Verify file permissions
- Check console output for error messages

### Backend Connection Issues
- Ensure backend is running on the correct port
- Check firewall settings
- Verify `VITE_API_URL` in `.env`

### Prediction Errors
- Verify your feature extraction matches the model's training
- Check that input sequences only contain valid amino acids
- Review backend logs for detailed error messages

## Technologies Used

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + GSAP
- **Backend**: Flask + Python
- **ML**: scikit-learn (for loading pickle models)

## License

MIT License - Feel free to use and modify for your projects!
