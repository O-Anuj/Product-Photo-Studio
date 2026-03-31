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
      
      // Extract base64 data and mime type
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
    <div className="min-h-screen bg-[#F9F9F9] text-[#1A1A1A] font-sans selection:bg-orange-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Product Studio</h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
            <span>Upload</span>
            <ChevronRight className="w-4 h-4" />
            <span>Style</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-black">Generate</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-8">
            {/* Mode Selection */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Select Mode</h2>
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setMode('studio')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all
                    ${mode === 'studio' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Box className="w-4 h-4" />
                  Studio
                </button>
                <button
                  onClick={() => setMode('avatar')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all
                    ${mode === 'avatar' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <User className="w-4 h-4" />
                  Avatar
                </button>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">1. Upload Product</h2>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group
                  ${selectedImage ? 'border-black bg-white' : 'border-gray-200 hover:border-gray-400 bg-gray-50'}`}
              >
                {selectedImage ? (
                  <>
                    <img 
                      src={selectedImage} 
                      alt="Original" 
                      className="absolute inset-0 w-full h-full object-contain p-4"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                      <span className="text-white text-sm font-medium">Change Image</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Click to upload</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
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

            {mode === 'studio' ? (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">2. Select Background</h2>
                <div className="grid grid-cols-1 gap-3">
                  {STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style)}
                      className={`p-4 rounded-xl border text-left transition-all relative group
                        ${selectedStyle.id === style.id 
                          ? 'border-black bg-white shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300 bg-transparent'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-semibold">{style.name}</h3>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{style.description}</p>
                        </div>
                        {selectedStyle.id === style.id && (
                          <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">2. Select Gender</h2>
                <div className="grid grid-cols-2 gap-3">
                  {(['female', 'male'] as const).map((gender) => (
                    <button
                      key={gender}
                      onClick={() => setSelectedGender(gender)}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all relative
                        ${selectedGender === gender 
                          ? 'border-black bg-white shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300 bg-transparent'}`}
                    >
                      <UserCircle className={`w-8 h-8 ${selectedGender === gender ? 'text-black' : 'text-gray-300'}`} />
                      <span className="text-sm font-semibold capitalize">{gender}</span>
                      {selectedGender === gender && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                          <Check className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {mode === 'avatar' && (
              <>
                <section>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">3. Scene Selector</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {SCENES.map((scene) => (
                      <button
                        key={scene.id}
                        onClick={() => setSelectedScene(scene)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all
                          ${selectedScene.id === scene.id 
                            ? 'border-black bg-white shadow-sm text-black' 
                            : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                      >
                        {scene.name}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">4. Pose Selector</h2>
                  <div className="grid grid-cols-1 gap-2">
                    {POSES.map((pose) => (
                      <button
                        key={pose.id}
                        onClick={() => setSelectedPose(pose)}
                        className={`py-2.5 px-4 rounded-xl text-xs font-bold border text-left transition-all relative
                          ${selectedPose.id === pose.id 
                            ? 'border-black bg-white shadow-sm text-black' 
                            : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{pose.name}</span>
                          {selectedPose.id === pose.id && (
                            <Check className="w-3.5 h-3.5 text-black" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">5. Appearance</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Hair Color</label>
                      <div className="flex flex-wrap gap-1.5">
                        {HAIR_COLORS.map((color) => (
                          <button
                            key={color.id}
                            onClick={() => setSelectedHairColor(color)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all
                              ${selectedHairColor.id === color.id 
                                ? 'border-black bg-black text-white' 
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                          >
                            {color.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Hairstyle</label>
                      <div className="flex flex-wrap gap-1.5">
                        {HAIRSTYLES.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => setSelectedHairstyle(style)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all
                              ${selectedHairstyle.id === style.id 
                                ? 'border-black bg-black text-white' 
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                          >
                            {style.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Skin Tone</label>
                      <div className="flex flex-wrap gap-1.5">
                        {SKIN_TONES.map((tone) => (
                          <button
                            key={tone.id}
                            onClick={() => setSelectedSkinTone(tone)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all
                              ${selectedSkinTone.id === tone.id 
                                ? 'border-black bg-black text-white' 
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                          >
                            {tone.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Aspect Ratio Selection */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">{mode === 'studio' ? '3' : '6'}. Aspect Ratio</h2>
              <div className="grid grid-cols-3 gap-2">
                {(['1:1', '16:9', '4:3'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setSelectedAspectRatio(ratio)}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all
                      ${selectedAspectRatio === ratio 
                        ? 'border-black bg-white shadow-sm text-black' 
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </section>

            <button
              onClick={generatePhoto}
              disabled={!selectedImage || isGenerating}
              className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all
                ${!selectedImage || isGenerating 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-gray-800 active:scale-[0.98]'}`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate Studio Photo
                </>
              )}
            </button>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
                {error}
              </p>
            )}
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-8">
            <div className={`bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm relative flex items-center justify-center transition-all duration-500
              ${selectedAspectRatio === '1:1' ? 'aspect-square' : selectedAspectRatio === '16:9' ? 'aspect-video' : 'aspect-[4/3]'}`}>
              <AnimatePresence mode="wait">
                {generatedImage ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full"
                  >
                    <img 
                      src={generatedImage} 
                      alt="Generated Result" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-6 right-6">
                      <a 
                        href={generatedImage} 
                        download="product-studio-result.png"
                        className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold border border-gray-200 hover:bg-white transition-colors shadow-sm"
                      >
                        Download Image
                      </a>
                    </div>
                  </motion.div>
                ) : isGenerating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
                      <Wand2 className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold">Creating your studio photo</p>
                      <p className="text-xs text-gray-400 mt-1">Applying lighting and background...</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 text-gray-300"
                  >
                    <ImageIcon className="w-16 h-16" />
                    <p className="text-sm font-medium">Your generated photo will appear here</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tips/Info */}
            <div className="mt-8 grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                  <Check className="w-4 h-4 text-orange-600" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Studio Lighting</h4>
                <p className="text-xs text-gray-500 leading-relaxed">AI automatically adds soft shadows and professional highlights.</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <Check className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Object Preservation</h4>
                <p className="text-xs text-gray-500 leading-relaxed">The product remains identical while the environment transforms.</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider">High Resolution</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Output is optimized for e-commerce and social media use.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
