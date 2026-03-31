/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ChangeEvent } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Image as ImageIcon, Loader2, Wand2, Check, ChevronRight, User, UserCircle, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STYLES = [
  { id: 'white', name: 'White Studio', description: 'Clean, minimalist white background with soft shadows', prompt: 'on a clean, minimalist professional white studio background with soft natural shadows and high-end studio lighting' },
  { id: 'marble', name: 'Elegant Marble', description: 'Luxury marble surface with soft ambient light', prompt: 'placed on a premium white marble surface with soft, elegant ambient lighting and realistic reflections' },
  { id: 'dark', name: 'Moody Dark', description: 'Dramatic dark background with spotlighting', prompt: 'on a dark, moody charcoal grey background with dramatic spotlighting and professional product photography shadows' },
  { id: 'lifestyle', name: 'Lifestyle', description: 'Natural wooden surface in a bright room', prompt: 'on a natural light oak wooden table in a bright, airy modern room with soft morning sunlight and shallow depth of field' },
];

const SCENES = [
  { id: 'studio', name: 'Studio', prompt: 'in a high-end professional photography studio with clean lighting' },
  { id: 'gym', name: 'Gym', prompt: 'inside a modern, well-equipped gym with fitness equipment in the background' },
  { id: 'urban', name: 'Urban City', prompt: 'on a busy urban city street with modern architecture and soft city bokeh' },
  { id: 'nature', name: 'Nature', prompt: 'in a beautiful outdoor natural setting with soft sunlight' },
  { id: 'home', name: 'Home', prompt: 'in a cozy, modern home interior lifestyle setting' },
];

const POSES = [
  { id: 'neutral', name: 'Standing / Neutral', prompt: 'in a natural standing neutral pose' },
  { id: 'action', name: 'Action / In-use', prompt: 'actively using the product in a dynamic action pose' },
  { id: 'closeup', name: 'Close-up Focus', prompt: 'in a close-up shot focusing on the product details' },
  { id: 'side', name: 'Side-angle Dynamic', prompt: 'in a dynamic side-angle pose showing the product from the side' },
];

const HAIR_COLORS = [
  { id: 'black', name: 'Black' },
  { id: 'brown', name: 'Brown' },
  { id: 'blonde', name: 'Blonde' },
  { id: 'red', name: 'Red' },
  { id: 'grey', name: 'Grey' },
];

const HAIRSTYLES = [
  { id: 'short', name: 'Short' },
  { id: 'medium', name: 'Medium' },
  { id: 'long', name: 'Long' },
  { id: 'curly', name: 'Curly' },
  { id: 'bun', name: 'Bun' },
  { id: 'pixie', name: 'Pixie' },
];

const SKIN_TONES = [
  { id: 'fair', name: 'Fair' },
  { id: 'light', name: 'Light' },
  { id: 'medium', name: 'Medium' },
  { id: 'tan', name: 'Tan' },
  { id: 'deep', name: 'Deep' },
];

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'studio' | 'avatar'>('studio');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('female');
  const [selectedScene, setSelectedScene] = useState(SCENES[0]);
  const [selectedPose, setSelectedPose] = useState(POSES[0]);
  const [selectedHairColor, setSelectedHairColor] = useState(HAIR_COLORS[0]);
  const [selectedHairstyle, setSelectedHairstyle] = useState(HAIRSTYLES[2]);
  const [selectedSkinTone, setSelectedSkinTone] = useState(SKIN_TONES[2]);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<'1:1' | '16:9' | '4:3'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setGeneratedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePhoto = async () => {
    if (!selectedImage) return;

    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = 'gemini-2.5-flash-image';
      
      const base64Data = selectedImage.split(',')[1];
      const mimeType = selectedImage.split(';')[0].split(':')[1];

      let prompt = '';
      if (mode === 'studio') {
        prompt = `Keep the product in this image exactly as it is, but replace the entire background. Place the product ${selectedStyle.prompt}. Ensure the lighting on the product matches the new background perfectly. High-quality professional product photography.`;
      } else {
        prompt = `Keep the product in this image exactly as it is in terms of shape, color, and details. Generate a realistic ${selectedGender} human model with ${selectedSkinTone.name.toLowerCase()} skin tone, ${selectedHairColor.name.toLowerCase()} ${selectedHairstyle.name.toLowerCase()} hair, ${selectedPose.prompt}, naturally ${selectedScene.prompt}. Ensure the product is the central focus and clearly visible. Match the lighting and shadows on the product to the new person and environment perfectly. High-quality professional lifestyle photography.`;
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: selectedAspectRatio,
          },
        },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("No image was generated. Please try again.");
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate image. Please check your API key and connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-accent/20">
      {/* Navigation Rail / Header */}
      <header className="h-16 border-b border-ink/5 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ink rounded-full flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase">Product Studio</h1>
            <p className="text-[10px] font-medium text-ink/40 uppercase tracking-widest">AI Visualization Tool</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-ink text-white text-[10px] flex items-center justify-center font-bold">1</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Upload</span>
          </div>
          <div className="w-4 h-[1px] bg-ink/10" />
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-ink text-white text-[10px] flex items-center justify-center font-bold">2</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Configure</span>
          </div>
          <div className="w-4 h-[1px] bg-ink/10" />
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-ink text-white text-[10px] flex items-center justify-center font-bold">3</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink">Generate</span>
          </div>
        </div>

        <button className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 border border-ink/10 rounded-full hover:bg-ink hover:text-white transition-all">
          Documentation
        </button>
      </header>

      <main className="max-w-[1600px] mx-auto grid lg:grid-cols-2 min-h-[calc(100vh-64px)]">
        {/* Left: Controls */}
        <div className="p-8 lg:p-12 border-r border-ink/5 bg-white overflow-y-auto max-h-[calc(100vh-64px)] scrollbar-hide">
          <div className="max-w-md mx-auto space-y-12">
            {/* Step 1: Mode & Upload */}
            <section className="space-y-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink/30">01. Source & Mode</h2>
                <div className="flex p-1 bg-paper rounded-full border border-ink/5">
                  <button
                    onClick={() => setMode('studio')}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all
                      ${mode === 'studio' ? 'bg-white shadow-sm text-ink' : 'text-ink/40 hover:text-ink/60'}`}
                  >
                    Studio
                  </button>
                  <button
                    onClick={() => setMode('avatar')}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all
                      ${mode === 'avatar' ? 'bg-white shadow-sm text-ink' : 'text-ink/40 hover:text-ink/60'}`}
                  >
                    Avatar
                  </button>
                </div>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-video rounded-2xl border border-ink/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group overflow-hidden
                  ${selectedImage ? 'bg-paper' : 'bg-paper/50 hover:bg-paper'}`}
              >
                {selectedImage ? (
                  <>
                    <img 
                      src={selectedImage} 
                      alt="Original" 
                      className="w-full h-full object-contain p-6"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                      <span className="text-white text-[10px] font-bold uppercase tracking-[0.2em]">Replace Asset</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white border border-ink/5 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5 text-ink/40" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest">Drop product image</p>
                      <p className="text-[9px] text-ink/30 uppercase tracking-widest mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </section>

            {/* Step 2: Configuration */}
            <section className="space-y-8">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink/30">02. Configuration</h2>
              
              {mode === 'studio' ? (
                <div className="grid grid-cols-1 gap-3">
                  {STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style)}
                      className={`p-5 rounded-2xl border text-left transition-all relative group
                        ${selectedStyle.id === style.id 
                          ? 'border-ink bg-white shadow-xl shadow-ink/5' 
                          : 'border-ink/5 hover:border-ink/20 bg-transparent'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="text-[11px] font-bold uppercase tracking-widest">{style.name}</h3>
                          <p className="text-[10px] text-ink/40 leading-relaxed max-w-[200px]">{style.description}</p>
                        </div>
                        {selectedStyle.id === style.id && (
                          <div className="w-5 h-5 bg-ink rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-10">
                  {/* Gender */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Model Identity</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['female', 'male'] as const).map((gender) => (
                        <button
                          key={gender}
                          onClick={() => setSelectedGender(gender)}
                          className={`p-4 rounded-2xl border flex items-center gap-4 transition-all
                            ${selectedGender === gender 
                              ? 'border-ink bg-white shadow-lg shadow-ink/5' 
                              : 'border-ink/5 hover:border-ink/20 bg-transparent'}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedGender === gender ? 'bg-ink text-white' : 'bg-paper text-ink/20'}`}>
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-bold uppercase tracking-widest">{gender}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scene & Pose */}
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Environment</label>
                      <div className="flex flex-col gap-2">
                        {SCENES.map((scene) => (
                          <button
                            key={scene.id}
                            onClick={() => setSelectedScene(scene)}
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all text-left
                              ${selectedScene.id === scene.id 
                                ? 'border-ink bg-ink text-white' 
                                : 'border-ink/5 text-ink/40 hover:border-ink/20'}`}
                          >
                            {scene.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Action</label>
                      <div className="flex flex-col gap-2">
                        {POSES.map((pose) => (
                          <button
                            key={pose.id}
                            onClick={() => setSelectedPose(pose)}
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all text-left
                              ${selectedPose.id === pose.id 
                                ? 'border-ink bg-ink text-white' 
                                : 'border-ink/5 text-ink/40 hover:border-ink/20'}`}
                          >
                            {pose.name.split(' / ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Appearance */}
                  <div className="space-y-6 pt-4 border-t border-ink/5">
                    <h3 className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Appearance Details</h3>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[9px] font-bold text-ink/40 uppercase tracking-[0.2em]">Hair</label>
                        <div className="flex flex-wrap gap-2">
                          {HAIR_COLORS.map((color) => (
                            <button
                              key={color.id}
                              onClick={() => setSelectedHairColor(color)}
                              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all
                                ${selectedHairColor.id === color.id 
                                  ? 'border-ink bg-ink text-white' 
                                  : 'border-ink/5 text-ink/40 hover:border-ink/20'}`}
                            >
                              {color.name}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {HAIRSTYLES.map((style) => (
                            <button
                              key={style.id}
                              onClick={() => setSelectedHairstyle(style)}
                              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all
                                ${selectedHairstyle.id === style.id 
                                  ? 'border-ink bg-ink text-white' 
                                  : 'border-ink/5 text-ink/40 hover:border-ink/20'}`}
                            >
                              {style.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] font-bold text-ink/40 uppercase tracking-[0.2em]">Skin Tone</label>
                        <div className="flex flex-wrap gap-2">
                          {SKIN_TONES.map((tone) => (
                            <button
                              key={tone.id}
                              onClick={() => setSelectedSkinTone(tone)}
                              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all
                                ${selectedSkinTone.id === tone.id 
                                  ? 'border-ink bg-ink text-white' 
                                  : 'border-ink/5 text-ink/40 hover:border-ink/20'}`}
                            >
                              {tone.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Step 3: Output */}
            <section className="space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink/30">03. Output Format</h2>
              <div className="grid grid-cols-3 gap-3">
                {(['1:1', '16:9', '4:3'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setSelectedAspectRatio(ratio)}
                    className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all
                      ${selectedAspectRatio === ratio 
                        ? 'border-ink bg-white shadow-sm text-ink' 
                        : 'border-ink/5 text-ink/40 hover:border-ink/20'}`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </section>

            <div className="pt-8">
              <button
                onClick={generatePhoto}
                disabled={!selectedImage || isGenerating}
                className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all shadow-2xl
                  ${!selectedImage || isGenerating 
                    ? 'bg-ink/5 text-ink/20 cursor-not-allowed' 
                    : 'bg-ink text-white hover:bg-accent hover:shadow-accent/20 active:scale-[0.98]'}`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Visualization
                  </>
                )}
              </button>
              
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-50 p-4 rounded-2xl border border-red-100 mt-4 text-center"
                >
                  {error}
                </motion.p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Result */}
        <div className="bg-paper p-8 lg:p-12 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-ink/5 blur-[120px] rounded-full" />
          </div>

          <div className="w-full max-w-4xl space-y-8 relative z-10">
            <div className={`bg-white rounded-[40px] border border-ink/5 overflow-hidden shadow-2xl shadow-ink/10 relative flex items-center justify-center transition-all duration-700 ease-in-out
              ${selectedAspectRatio === '1:1' ? 'aspect-square' : selectedAspectRatio === '16:9' ? 'aspect-video' : 'aspect-[4/3]'}`}>
              <AnimatePresence mode="wait">
                {generatedImage ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full h-full group"
                  >
                    <img 
                      src={generatedImage} 
                      alt="Generated Result" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                      <a 
                        href={generatedImage} 
                        download="product-studio-result.png"
                        className="bg-white px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-accent hover:text-white transition-all shadow-2xl"
                      >
                        Export High-Res
                      </a>
                    </div>
                  </motion.div>
                ) : isGenerating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-8"
                  >
                    <div className="relative">
                      <div className="w-24 h-24 border-[1px] border-ink/5 border-t-accent rounded-full animate-spin" />
                      <Wand2 className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-ink" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-xs font-bold uppercase tracking-[0.3em]">Synthesizing Scene</p>
                      <p className="text-[10px] text-ink/30 uppercase tracking-widest">Matching lighting & geometry...</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-6 text-ink/10"
                  >
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-ink/10 flex items-center justify-center">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Awaiting Visualization</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Status / Info Bar */}
            <div className="grid grid-cols-3 gap-8 px-4">
              <div className="space-y-3">
                <div className="h-[1px] bg-ink/10 w-full" />
                <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink/40">Precision</h4>
                <p className="text-[10px] font-medium leading-relaxed">AI preserves product geometry with sub-pixel accuracy.</p>
              </div>
              <div className="space-y-3">
                <div className="h-[1px] bg-ink/10 w-full" />
                <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink/40">Atmosphere</h4>
                <p className="text-[10px] font-medium leading-relaxed">Global illumination is calculated to match the selected scene.</p>
              </div>
              <div className="space-y-3">
                <div className="h-[1px] bg-ink/10 w-full" />
                <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink/40">Resolution</h4>
                <p className="text-[10px] font-medium leading-relaxed">Optimized for professional e-commerce and social displays.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
