import { create } from 'zustand';

export type BoloState = 'IDLE' | 'TAP' | 'GROUNDING' | 'TALKING' | 'REPAIR';

export interface TapPoint {
  x: number; // percentage (0-100) or pixel
  y: number; // percentage (0-100) or pixel
}

export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BoloStoreState {
  // Core state machine
  status: BoloState;

  // Grounding & interaction data
  bbox: BBox | null;
  tapPoint: TapPoint | null;
  objectName: string | null;
  transcript: string | null;
  isTalking: boolean;
  currentScreen: 'camera' | 'repair' | 'inspector';

  // Extra context & metadata
  hindiTranscript: string | null;
  englishTranscript: string | null;
  repairReason: string | null;
  repairCandidates: string[];
  repairSteps: string[];
  audioWaveLevel: number;
  cameraFacing: 'environment' | 'user';
  isDarkMode: boolean;

  // State actions
  setStatus: (status: BoloState) => void;
  setTapPoint: (point: TapPoint) => void;
  setBbox: (bbox: BBox | null) => void;
  setObjectName: (name: string | null) => void;
  setRepairSteps: (steps: string[]) => void;

  handleTap: (point: TapPoint) => void;
  startGrounding: () => void;
  groundingSuccess: (data: {
    bbox: BBox;
    objectName: string;
    hindiTranscript?: string;
    englishTranscript?: string;
  }) => void;
  groundingFailed: (reason?: string, candidates?: string[]) => void;
  startTalking: (initialTranscript?: string) => void;
  stopTalking: () => void;
  setTranscript: (transcript: string, hindiTranscript?: string) => void;
  setIsTalking: (isTalking: boolean) => void;
  triggerRepair: (reason?: string, candidates?: string[]) => void;
  resolveRepair: (chosenObjectName: string, newBbox?: BBox) => void;
  resetToIdle: () => void;
  setCurrentScreen: (screen: 'camera' | 'repair' | 'inspector') => void;
  setAudioWaveLevel: (level: number) => void;
  toggleDarkMode: () => void;
  toggleCameraFacing: () => void;
}

export const useBoloStore = create<BoloStoreState>((set, get) => ({
  status: 'IDLE',
  bbox: null,
  tapPoint: null,
  objectName: null,
  transcript: null,
  isTalking: false,
  currentScreen: 'camera',

  hindiTranscript: null,
  englishTranscript: null,
  repairReason: null,
  repairCandidates: [],
  repairSteps: [],
  audioWaveLevel: 0,
  cameraFacing: 'environment',
  isDarkMode: false,

  setStatus: (status: BoloState) => set({ status }),
  setTapPoint: (point: TapPoint) => set({ tapPoint: point }),
  setBbox: (bbox: BBox | null) => set({ bbox }),
  setObjectName: (objectName: string | null) => set({ objectName }),
  setRepairSteps: (repairSteps: string[]) => set({ repairSteps }),

  handleTap: (point: TapPoint) => {
    set({
      status: 'GROUNDING',
      tapPoint: point,
      bbox: null,
      objectName: null,
      transcript: null,
      hindiTranscript: null,
      englishTranscript: null,
      isTalking: false,
      repairReason: null,
      repairSteps: [],
    });
  },

  startGrounding: () => {
    set({
      status: 'GROUNDING',
      isTalking: false,
    });
  },

  groundingSuccess: ({ bbox, objectName, hindiTranscript, englishTranscript }) => {
    set({
      status: 'TALKING',
      bbox,
      objectName,
      transcript: hindiTranscript || englishTranscript || `${objectName} is speaking!`,
      hindiTranscript: hindiTranscript || null,
      englishTranscript: englishTranscript || null,
      isTalking: true,
    });
  },

  groundingFailed: (reason = 'Object could not be recognized clearly', candidates = []) => {
    set({
      status: 'REPAIR',
      repairReason: reason,
      repairCandidates: candidates.length > 0 ? candidates : ['Desk', 'Background', 'Object in hand'],
      isTalking: false,
    });
  },

  startTalking: (initialTranscript) => {
    set((state) => ({
      status: 'TALKING',
      isTalking: true,
      transcript: initialTranscript || state.transcript,
    }));
  },

  stopTalking: () => {
    set({
      isTalking: false,
      audioWaveLevel: 0,
    });
  },

  setTranscript: (transcript: string, hindiTranscript?: string) => {
    set({
      transcript,
      hindiTranscript: hindiTranscript || get().hindiTranscript,
    });
  },

  setIsTalking: (isTalking: boolean) => {
    set({ isTalking });
  },

  triggerRepair: (reason = 'Disambiguation needed', candidates = []) => {
    set({
      status: 'REPAIR',
      repairReason: reason,
      repairCandidates: candidates.length > 0 ? candidates : [get().objectName || 'Main Object', 'Alternative Object', 'Surrounding Area'],
      isTalking: false,
    });
  },

  resolveRepair: (chosenObjectName: string, newBbox?: BBox) => {
    set((state) => ({
      status: 'TALKING',
      objectName: chosenObjectName,
      bbox: newBbox || state.bbox,
      repairReason: null,
      isTalking: true,
      transcript: `नमस्ते! मैं ${chosenObjectName} हूँ।`,
      hindiTranscript: `नमस्ते! मैं ${chosenObjectName} हूँ। मुझसे कुछ भी पूछिए।`,
      englishTranscript: `Hello! I am ${chosenObjectName}. Ask me anything.`,
    }));
  },

  resetToIdle: () => {
    set({
      status: 'IDLE',
      bbox: null,
      tapPoint: null,
      objectName: null,
      transcript: null,
      hindiTranscript: null,
      englishTranscript: null,
      isTalking: false,
      repairReason: null,
      repairCandidates: [],
      repairSteps: [],
      audioWaveLevel: 0,
    });
  },

  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  setAudioWaveLevel: (audioWaveLevel) => set({ audioWaveLevel }),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  toggleCameraFacing: () =>
    set((state) => ({
      cameraFacing: state.cameraFacing === 'environment' ? 'user' : 'environment',
    })),
}));
