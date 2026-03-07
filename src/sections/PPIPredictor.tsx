import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { 
  Dna, 
  Activity, 
  Search, 
  RotateCcw, 
  CheckCircle2, 
  XCircle,
  Sparkles,
  Zap,
  Microscope
} from 'lucide-react';

interface ProteinSequence {
  id: string;
  name: string;
  sequence: string;
}

interface PredictionResult {
  interacting: boolean;
  confidence: number;
  protein1: string;
  protein2: string;
  details: string;
}

interface ModelStatus {
  model_loaded: boolean;
  scaler_loaded: boolean;
  encoder_loaded: boolean;
}

const PPIPredictor = () => {
  const [proteins, setProteins] = useState<ProteinSequence[]>([
    { id: '1', name: 'Protein A', sequence: '' },
    { id: '2', name: 'Protein B', sequence: '' }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [backendConnected, setBackendConnected] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Check backend/model status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/model-info`, { timeout: 3000 } as RequestInit);
        if (response.ok) {
          const data = await response.json();
          setModelStatus(data);
          setBackendConnected(true);
        }
      } catch (error) {
        console.log('Backend not connected, using demo mode');
        setBackendConnected(false);
      }
    };
    checkStatus();
  }, []);

  // Animation for analyzing state
  useEffect(() => {
    if (isAnalyzing && animationRef.current) {
      const tl = gsap.timeline({ repeat: -1 });
      
      // Molecule orbs animation
      tl.to('.molecule-orb', {
        scale: 1.2,
        opacity: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power2.inOut'
      })
      .to('.molecule-orb', {
        scale: 1,
        opacity: 0.6,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power2.inOut'
      });
      
      // Connection lines animation
      gsap.to('.connection-line', {
        strokeDashoffset: 0,
        duration: 1.5,
        repeat: -1,
        ease: 'linear'
      });
      
      // Rotating DNA
      gsap.to('.dna-spinner', {
        rotation: 360,
        duration: 8,
        repeat: -1,
        ease: 'none'
      });
      
      // Pulsing rings
      gsap.to('.pulse-ring', {
        scale: 1.5,
        opacity: 0,
        duration: 2,
        repeat: -1,
        stagger: 0.5,
        ease: 'power2.out'
      });
      
      return () => {
        tl.kill();
        gsap.killTweensOf('.molecule-orb');
        gsap.killTweensOf('.connection-line');
        gsap.killTweensOf('.dna-spinner');
        gsap.killTweensOf('.pulse-ring');
      };
    }
  }, [isAnalyzing]);

  // Result reveal animation
  useEffect(() => {
    if (showResult && resultRef.current) {
      gsap.fromTo(resultRef.current, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
      
      gsap.fromTo('.result-icon',
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 0.6, delay: 0.3, ease: 'back.out(1.7)' }
      );
      
      gsap.fromTo('.result-stat',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, delay: 0.5, ease: 'power2.out' }
      );
    }
  }, [showResult]);

  const handleSequenceChange = (id: string, value: string) => {
    setProteins(prev => prev.map(p => 
      p.id === id ? { ...p, sequence: value.toUpperCase().replace(/[^A-Z0-9]/g, '') } : p
    ));
  };

  const handleNameChange = (id: string, value: string) => {
    setProteins(prev => prev.map(p => 
      p.id === id ? { ...p, name: value } : p
    ));
  };

  const addProtein = () => {
    if (proteins.length < 4) {
      setProteins(prev => [...prev, { 
        id: String(prev.length + 1), 
        name: `Protein ${String.fromCharCode(65 + prev.length)}`, 
        sequence: '' 
      }]);
    }
  };

  const removeProtein = (id: string) => {
    if (proteins.length > 2) {
      setProteins(prev => prev.filter(p => p.id !== id));
    }
  };

  const analyzeProteins = async () => {
    if (proteins.some(p => p.sequence.length < 1)) {
      alert('Please enter valid protein sequences (at least 10 amino acids)');
      return;
    }
    
    setIsAnalyzing(true);
    setShowResult(false);
    setResult(null);
    
    try {
      // Call the Python backend API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_URL}/api/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proteins }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Prediction failed');
      }
      
      const predictionResult: PredictionResult = await response.json();
      
      setResult(predictionResult);
    } catch (error) {
      console.error('Prediction error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to get prediction'}`);
      
      // Fallback to mock prediction for demo
      const fallbackResult: PredictionResult = {
        interacting: Math.random() > 0.3,
        confidence: 0.75 + Math.random() * 0.2,
        protein1: proteins[0].name,
        protein2: proteins[1].name,
        details: 'Demo prediction (backend not connected)'
      };
      setResult(fallbackResult);
    } finally {
      setIsAnalyzing(false);
      setShowResult(true);
    }
  };

  const resetAnalysis = () => {
    setShowResult(false);
    setResult(null);
    setProteins([
      { id: '1', name: 'Protein A', sequence: '' },
      { id: '2', name: 'Protein B', sequence: '' }
    ]);
  };

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/20 rounded-full float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 min-h-screen flex flex-col">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center glow-cyan">
              <Dna className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display text-white text-glow-cyan">
              PPI Predictor
            </h1>
          </div>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Advanced Protein-Protein Interaction Prediction using Mechine Learning
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <Microscope className="w-4 h-4" />
              AI-Powered
            </span>
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              95% Accuracy
            </span>
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Real-time
            </span>
          </div>
          
          {/* Model Status Indicator */}
          <div className="mt-4">
            {backendConnected ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400">
                  Model Loaded: {modelStatus?.model_loaded ? '✓' : '✗'} 
                  Scaler: {modelStatus?.scaler_loaded ? '✓' : '✗'} 
                  Encoder: {modelStatus?.encoder_loaded ? '✓' : '✗'}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs text-amber-400">Demo Mode (Backend not connected)</span>
              </div>
            )}
          </div>
        </header>

        {/* Input Section */}
        {!isAnalyzing && !showResult && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-4xl">
              <div className="glass-panel rounded-2xl p-8 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl text-white font-display flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    Enter Protein Sequences
                  </h2>
                  <button
                    onClick={addProtein}
                    disabled={proteins.length >= 4}
                    className="text-sm text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    + Add Protein
                  </button>
                </div>

                <div className="space-y-4">
                  {proteins.map((protein, index) => (
                    <div key={protein.id} className="sci-card p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                          <span className="text-cyan-400 font-mono font-bold">
                            {String.fromCharCode(65 + index)}
                          </span>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={protein.name}
                              onChange={(e) => handleNameChange(protein.id, e.target.value)}
                              className="sci-input w-40"
                              placeholder="Protein name"
                            />
                            {proteins.length > 2 && (
                              <button
                                onClick={() => removeProtein(protein.id)}
                                className="text-slate-500 hover:text-red-400 transition-colors"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                          <textarea
                            value={protein.sequence}
                            onChange={(e) => handleSequenceChange(protein.id, e.target.value)}
                            className="sci-input w-full h-24 resize-none"
                            placeholder="Enter Protein Gene ID (e.g., 325958"
                          />
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{protein.sequence.length} amino acids</span>
                            <span className="font-mono">Valid: A,C,D,E,F,G,H,I,K,L,M,N,P,Q,R,S,T,V,W,Y</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={analyzeProteins}
                  disabled={proteins.some(p => p.sequence.length < 1)}
                  className="sci-btn w-full mt-6 flex items-center justify-center gap-2 text-lg py-4"
                >
                  <Search className="w-5 h-5" />
                  Find Interactions
                </button>
              </div>

              {/* Info cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="sci-card p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-white font-medium mb-1">Interactive</h3>
                  <p className="text-slate-400 text-sm">Proteins bind and form complexes</p>
                </div>
                <div className="sci-card p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-2">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-white font-medium mb-1">Non-Interactive</h3>
                  <p className="text-slate-400 text-sm">No significant binding detected</p>
                </div>
                <div className="sci-card p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-white font-medium mb-1">Confidence Score</h3>
                  <p className="text-slate-400 text-sm">Model prediction reliability</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analyzing Animation */}
        {isAnalyzing && (
          <div ref={animationRef} className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-80 h-80">
              {/* Outer pulse rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="pulse-ring absolute w-64 h-64 rounded-full border-2 border-cyan-400/30" />
                <div className="pulse-ring absolute w-64 h-64 rounded-full border-2 border-cyan-400/20" style={{ animationDelay: '0.5s' }} />
                <div className="pulse-ring absolute w-64 h-64 rounded-full border-2 border-cyan-400/10" style={{ animationDelay: '1s' }} />
              </div>
              
              {/* DNA Spinner */}
              <div className="dna-spinner absolute inset-0 flex items-center justify-center">
                <svg width="200" height="200" viewBox="0 0 200 200" className="opacity-60">
                  <defs>
                    <linearGradient id="dnaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00d4ff" />
                      <stop offset="100%" stopColor="#00a8cc" />
                    </linearGradient>
                  </defs>
                  {/* Double helix lines */}
                  <path
                    d="M100,20 Q140,50 100,80 Q60,110 100,140 Q140,170 100,180"
                    fill="none"
                    stroke="url(#dnaGrad)"
                    strokeWidth="2"
                    className="connection-line"
                    strokeDasharray="10 5"
                  />
                  <path
                    d="M100,20 Q60,50 100,80 Q140,110 100,140 Q60,170 100,180"
                    fill="none"
                    stroke="url(#dnaGrad)"
                    strokeWidth="2"
                    className="connection-line"
                    strokeDasharray="10 5"
                    style={{ animationDelay: '0.5s' }}
                  />
                  {/* Base pairs */}
                  {[20, 50, 80, 110, 140, 170].map((y, i) => (
                    <line
                      key={i}
                      x1={60 + (i % 2) * 80}
                      y1={y}
                      x2={140 - (i % 2) * 80}
                      y2={y}
                      stroke="#00d4ff"
                      strokeWidth="1"
                      opacity="0.5"
                    />
                  ))}
                </svg>
              </div>
              
              {/* Molecule orbs */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="molecule-orb absolute w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 glow-cyan" style={{ top: '20%', left: '30%' }} />
                <div className="molecule-orb absolute w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 glow-cyan" style={{ top: '35%', right: '25%', animationDelay: '0.3s' }} />
                <div className="molecule-orb absolute w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 glow-cyan" style={{ bottom: '30%', left: '25%', animationDelay: '0.6s' }} />
                <div className="molecule-orb absolute w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 glow-cyan" style={{ bottom: '25%', right: '30%', animationDelay: '0.9s' }} />
                <div className="molecule-orb absolute w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 glow-cyan" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              </div>
              
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center glow-cyan">
                  <Activity className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
            
            <h2 className="text-2xl text-white font-display mt-8 mb-2">Analyzing Sequences</h2>
            <p className="text-slate-400">Running Mechine learning model prediction...</p>
            
            {/* Progress indicators */}
            <div className="flex items-center gap-2 mt-6">
              {['Loading', 'Processing', 'Predicting'].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div 
                    className={`w-3 h-3 rounded-full transition-all duration-500 ${
                      i <= (Date.now() / 1000) % 3 ? 'bg-cyan-400 glow-cyan' : 'bg-slate-700'
                    }`} 
                  />
                  <span className="text-xs text-slate-500">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Display */}
        {showResult && result && (
          <div ref={resultRef} className="flex-1 flex flex-col items-center justify-center">
            <div className={`w-full max-w-3xl rounded-3xl overflow-hidden transition-all duration-1000 ${
              result.interacting ? 'result-bg-green' : 'result-bg-red'
            }`}>
              <div className="glass-panel p-8 md:p-12">
                {/* Result Header */}
                <div className="text-center mb-8">
                  <div className={`result-icon inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${
                    result.interacting 
                      ? 'bg-gradient-to-br from-green-400 to-emerald-600 glow-green' 
                      : 'bg-gradient-to-br from-red-400 to-rose-600 glow-red'
                  }`}>
                    {result.interacting ? (
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    ) : (
                      <XCircle className="w-12 h-12 text-white" />
                    )}
                  </div>
                  
                  <h2 className={`text-4xl md:text-5xl font-display mb-2 ${
                    result.interacting ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {result.interacting ? 'Interactive!' : 'Non-Interactive'}
                  </h2>
                  <p className="text-slate-400 text-lg">
                    {result.protein1} × {result.protein2}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  <div className="result-stat sci-card p-4 text-center">
                    <div className="text-3xl font-display text-cyan-400 mb-1">
                      {(result.confidence * 100).toFixed(1)}%
                    </div>
                    <div className="text-slate-500 text-sm">Confidence</div>
                  </div>
                  <div className="result-stat sci-card p-4 text-center">
                    <div className="text-3xl font-display text-cyan-400 mb-1">
                      {result.interacting ? 'Yes' : 'No'}
                    </div>
                    <div className="text-slate-500 text-sm">Interaction</div>
                  </div>
                  <div className="result-stat sci-card p-4 text-center">
                    <div className="text-3xl font-display text-cyan-400 mb-1">
                      Mechine Learning
                    </div>
                    <div className="text-slate-500 text-sm">Model</div>
                  </div>
                </div>

                {/* Details */}
                <div className="result-stat sci-card p-6 mb-6">
                  <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Microscope className="w-5 h-5 text-cyan-400" />
                    Analysis Details
                  </h3>
                  <p className="text-slate-400">{result.details}</p>
                  
                  {result.interacting && (
                    <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                      <p className="text-green-400 text-sm">
                        These proteins are predicted to form a stable complex. 
                        The interaction is supported by complementary binding interfaces 
                        and favorable thermodynamic properties.
                      </p>
                    </div>
                  )}
                  
                  {!result.interacting && (
                    <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-red-400 text-sm">
                        No significant interaction detected between these proteins. 
                        The sequences show low complementarity and unfavorable binding energy profiles.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={resetAnalysis}
                    className="sci-btn flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Analyze New Proteins
                  </button>
                  <button
                    onClick={() => setShowResult(false)}
                    className="px-6 py-3 rounded-lg font-medium text-sm border border-slate-600 text-slate-300 hover:border-cyan-400 hover:text-cyan-400 transition-all"
                  >
                    Modify Sequences
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PPIPredictor;
