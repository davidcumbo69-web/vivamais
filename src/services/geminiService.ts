import { GoogleGenAI, Type } from "@google/genai";

let genAI: any = null;

function getAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please check your environment variables.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

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
  patterns: string[];
  trends: string[];
  lastMedications: string[];
  lastExams: string[];
  recommendations: string[];
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
    const ai = getAI();
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
    const ai = getAI();
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
    const ai = getAI();
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
   * Compares multiple clinical histories, patient profiles, prescriptions, taken doses history, and clinical notes to identify trends, compliance patterns, and recommend next clinical steps.
   */
  async analyzePatientEvolution(
    histories: any[],
    patientData?: {
      profile?: any;
      prescriptions?: any[];
      privateNotes?: string;
    }
  ): Promise<AIEvolutionResult> {
    const ai = getAI();
    
    let analysisPayload = `Dados do Histórico Clínico (Consultas):\n${JSON.stringify(histories, null, 2)}\n\n`;
    
    if (patientData) {
      if (patientData.profile) {
        analysisPayload += `Perfil do Paciente:\n${JSON.stringify(patientData.profile, null, 2)}\n\n`;
      }
      if (patientData.prescriptions) {
        analysisPayload += `Receitas e Acompanhamento de Doses Tomadas:\n${JSON.stringify(patientData.prescriptions, null, 2)}\n\n`;
      }
      if (patientData.privateNotes) {
        analysisPayload += `Notas Clínicas Privadas do Profissional:\n${patientData.privateNotes}\n\n`;
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          text: `Analise de forma aprofundada a evolução clínica, o perfil, as receitas, o histórico de adesão medicamentosa e as notas de evolução deste paciente.

${analysisPayload}

Por favor, faça uma correlação precisa entre:
1. Perfil do paciente (idade, sexo, etc.) e as queixas.
2. O histórico de consultas e suas datas (timeline do progresso ou piora).
3. As receitas médicas emitidas, as datas em que foram criadas e as medicações prescritas.
4. O histórico de tomadas efetivas (doses tomadas vs planejadas, dias, horários e taxa de adesão).
5. As notas clínicas privadas (ex: se o paciente não apresenta melhoras mesmo após concluir a medicação, etc.).
6. Recomende modificações terapêuticas (quais medicações mudar, se necessário), novos exames ou condutas apropriadas.`
        }
      ],
      config: {
        systemInstruction: "Você é um analista médico e especialista em farmacologia clínica de IA avançada. Avalie a timeline completa do paciente: perfil demográfico, consultas, receitas prescritas, o registro real de tomadas do paciente (dias e horas em que tomou os remédios e taxa de conformidade) e notas clínicas de evolução do médico. Identifique padrões de não-resposta ao tratamento, baixa adesão, efeitos ou falhas terapêuticas, e faça sugestões extremamente precisas e fundamentadas de mudança ou ajuste de medicação, solicitação de exames diagnósticos e recomendações de conduta.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
            trends: { type: Type.ARRAY, items: { type: Type.STRING } },
            lastMedications: { type: Type.ARRAY, items: { type: Type.STRING } },
            lastExams: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "patterns", "trends", "lastMedications", "lastExams", "recommendations"]
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
    const ai = getAI();
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
