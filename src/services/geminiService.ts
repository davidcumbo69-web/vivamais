import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface AIDiagnosisOnlyResult {
  primaryDiagnosis: string;
  cid10: string;
  explanations: {
    physiological: string;
    pathological: string;
    clinical: string;
    socialEnvironmental: string;
    genetic?: string;
  };
  differentialDiagnoses: string[];
  recommendedExams: string[];
  guidance: {
    areasToExamine: string[];
    questionsToAsk: string[];
    maneuversToPerform: string[];
  };
}

export interface AIPrescriptionSuggestionResult {
  diagnosis: string;
  medications: {
    name: string;
    dosage: string;
    duration: string;
    instructions: string;
  }[];
  conduct: string;
}

export interface AIOcrResult {
  mainComplaint: string;
  detailedDescription: string;
  previousDiseases: string;
  surgeriesHistory: string;
  allergies: string;
  habitualMedication: string;
  hereditaryDiseases: string;
  physicalExamObservations: string;
  weight?: string;
  height?: string;
  temperature?: string;
  bloodPressure?: string;
  heartRate?: string;
  respiratoryRate?: string;
  spo2?: string;
}

export interface AIEvolutionResult {
  summary: string;
  trends: string[];
  suggestedConduct: string;
}

export interface AIMedicationSafetyResult {
  interactions: {
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
  allergyConflicts: string[];
  ongoingMedsReminders: string[];
}

export const geminiService = {
  /**
   * Suggests diagnosis and detailed clinical analysis (no treatment).
   */
  async analyzeClinicalHistory(historyData: any): Promise<AIDiagnosisOnlyResult> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          text: `Analise os seguintes dados clínicos e sugira um diagnóstico e análise detalhada. 
          NÃO sugira tratamento ou medicamentos agora.
          
          Dados:
          ${JSON.stringify(historyData, null, 2)}`
        }
      ],
      config: {
        systemInstruction: "Você é um assistente médico especialista de alto nível. Forneça diagnósticos precisos seguindo a CID-10 e análises fisiológicas, patológicas, clínicas, sociais e genéticas detalhadas. Forneça orientações sobre o que o médico não deve esquecer de examinar ou perguntar.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primaryDiagnosis: { type: Type.STRING },
            cid10: { type: Type.STRING },
            explanations: {
              type: Type.OBJECT,
              properties: {
                physiological: { type: Type.STRING },
                pathological: { type: Type.STRING },
                clinical: { type: Type.STRING },
                socialEnvironmental: { type: Type.STRING },
                genetic: { type: Type.STRING }
              },
              required: ["physiological", "pathological", "clinical", "socialEnvironmental"]
            },
            differentialDiagnoses: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            recommendedExams: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            guidance: {
              type: Type.OBJECT,
              properties: {
                areasToExamine: { type: Type.ARRAY, items: { type: Type.STRING } },
                questionsToAsk: { type: Type.ARRAY, items: { type: Type.STRING } },
                maneuversToPerform: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["areasToExamine", "questionsToAsk", "maneuversToPerform"]
            }
          },
          required: ["primaryDiagnosis", "cid10", "explanations", "guidance"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  },

  /**
   * Suggests a full prescription based on the clinical history.
   */
  async suggestPrescription(historyData: any, patientAllergies: string): Promise<AIPrescriptionSuggestionResult> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          text: `Com base na história clínica abaixo, gere uma sugestão completa de prescrição médica.
          Paciente tem as seguintes alergias registradas: ${patientAllergies || 'Nenhuma registrada'}.
          
          História Clínica:
          ${JSON.stringify(historyData, null, 2)}`
        }
      ],
      config: {
        systemInstruction: "Você é um assistente médico especialista. Gere uma prescrição completa (medicamentos, dosagens, durações e instruções) e a conduta médica recomendada. Seja extremamente cauteloso com alergias.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING },
            medications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  instructions: { type: Type.STRING }
                },
                required: ["name", "dosage", "duration", "instructions"]
              }
            },
            conduct: { type: Type.STRING }
          },
          required: ["diagnosis", "medications", "conduct"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  },

  /**
   * Extracts clinical history from an image (photo of paper records).
   */
  async processHistoryOCR(base64Image: string): Promise<AIOcrResult> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Extraia todas as informações clínicas deste documento de histórico médico para preencher um formulário digital." },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ],
      config: {
        systemInstruction: "Extraia dados estruturados de documentos médicos. Se um campo não estiver presente, deixe em branco.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mainComplaint: { type: Type.STRING },
            detailedDescription: { type: Type.STRING },
            previousDiseases: { type: Type.STRING },
            surgeriesHistory: { type: Type.STRING },
            allergies: { type: Type.STRING },
            habitualMedication: { type: Type.STRING },
            hereditaryDiseases: { type: Type.STRING },
            physicalExamObservations: { type: Type.STRING },
            weight: { type: Type.STRING },
            height: { type: Type.STRING },
            temperature: { type: Type.STRING },
            bloodPressure: { type: Type.STRING },
            heartRate: { type: Type.STRING },
            respiratoryRate: { type: Type.STRING },
            spo2: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  },

  /**
   * Compares multiple clinical histories to identify patterns.
   */
  async analyzePatientEvolution(histories: any[]): Promise<AIEvolutionResult> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          text: `Analise a evolução deste paciente com base no histórico de consultas:
          ${JSON.stringify(histories, null, 2)}`
        }
      ],
      config: {
        systemInstruction: "Identifique padrões, recorrências e tendências na saúde do paciente (ex: febres recorrentes, agravamento de valores). Sugira condutas baseadas nessas tendências.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            trends: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            suggestedConduct: { type: Type.STRING }
          },
          required: ["summary", "trends", "suggestedConduct"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  },

  /**
   * Checks for interactions, allergies, and ongoing meds conflicts.
   */
  async checkMedicationSafety(
    currentDiagnosis: string,
    newMedications: string[],
    patientAllergies: string,
    ongoingMedications: any[]
  ): Promise<AIMedicationSafetyResult> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          text: `Verifique a segurança desta prescrição:
          Diagnóstico Atual: ${currentDiagnosis}
          Novos Medicamentos: ${newMedications.join(', ')}
          Alergias do Paciente: ${patientAllergies}
          Medicamentos Atuais/Em curso: ${JSON.stringify(ongoingMedications, null, 2)}`
        }
      ],
      config: {
        systemInstruction: "Especialista em segurança farmacológica. Identifique interações medicamentosas, conflitos com alergias e duplicidade terapêutica.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            interactions: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
                  description: { type: Type.STRING }
                }
              } 
            },
            allergyConflicts: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            ongoingMedsReminders: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }
};
