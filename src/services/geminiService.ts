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
  },

  /**
   * Interprets laboratory exams using Gemini 3.5 Flash.
   */
  async interpretLabExam(examType: string, content: string, base64Image?: string, patientContext?: any): Promise<AILabExamResult> {
    const ai = getAI();
    let prompt = `Interprete o seguinte exame de laboratório:
Tipo do Exame: ${examType}
Dados do Exame (texto/resultados):
${content}
`;
    if (patientContext) {
      prompt += `\nContexto Clínico do Paciente: ${JSON.stringify(patientContext, null, 2)}`;
    }

    const contents: any[] = [];
    if (base64Image) {
      contents.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      });
      prompt += `\n(Uma imagem do exame foi enviada e está anexada acima para análise visual/multimodal)`;
    }
    contents.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: "Você é um patologista clínico e especialista médico sênior. Forneça uma interpretação precisa e profissional do exame de laboratório, destacando valores alterados, hipóteses diagnósticas e recomendações. Identifique as limitações e o nível de urgência.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            mainAlterations: { type: Type.ARRAY, items: { type: Type.STRING } },
            alteredValues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  parameter: { type: Type.STRING },
                  value: { type: Type.STRING },
                  referenceRange: { type: Type.STRING },
                  level: { type: Type.STRING, enum: ["normal", "altered", "critical"] }
                },
                required: ["parameter", "value", "level"]
              }
            },
            clinicalInterpretation: { type: Type.STRING },
            hypotheses: { type: Type.ARRAY, items: { type: Type.STRING } },
            differentialDiagnoses: { type: Type.ARRAY, items: { type: Type.STRING } },
            complementaryExams: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            urgency: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
            limitations: { type: Type.STRING },
            confidence: { type: Type.INTEGER }
          },
          required: ["summary", "mainAlterations", "alteredValues", "clinicalInterpretation", "hypotheses", "recommendations", "urgency", "confidence"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  },

  /**
   * Interprets image exams (multimodal) using Gemini 3.5 Flash.
   */
  async interpretImageExam(examType: string, base64Image: string, textContext?: string, patientContext?: any): Promise<AIImageExamResult> {
    const ai = getAI();
    let prompt = `Interprete este exame de imagem médica:
Tipo de Imagem: ${examType}
Observações clínicas adicionais/Sintomas: ${textContext || 'Nenhum'}
`;
    if (patientContext) {
      prompt += `\nContexto Clínico do Paciente: ${JSON.stringify(patientContext, null, 2)}`;
    }

    const contents = [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      },
      {
        text: prompt
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: "Você é um radiologista e especialista em diagnóstico por imagem sênior. Forneça uma análise multimodal precisa e profissional da imagem, descrevendo os achados radiológicos, conclusão clínica e nível de confiança. Descreva áreas suspeitas quando houver.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            findings: { type: Type.STRING },
            conclusion: { type: Type.STRING },
            confidence: { type: Type.INTEGER },
            annotatedRegions: { type: Type.STRING }
          },
          required: ["findings", "conclusion", "confidence"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  },

  /**
   * Compares an older exam with a newer exam using Gemini 3.5 Flash.
   */
  async compareExams(oldExam: any, currentExam: any): Promise<AIExamComparisonResult> {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Compare o exame anterior com o exame atual e identifique a evolução clínica do paciente.
Exame Anterior:
${JSON.stringify(oldExam, null, 2)}

Exame Atual:
${JSON.stringify(currentExam, null, 2)}`
        }
      ],
      config: {
        systemInstruction: "Você é um assistente médico especialista de alto nível. Analise a evolução temporal entre os dois exames e determine de forma detalhada o que melhorou, o que piorou, a percentagem de evolução estimada global, e gere pontos de comparação claros e estruturados.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            improved: { type: Type.ARRAY, items: { type: Type.STRING } },
            worsened: { type: Type.ARRAY, items: { type: Type.STRING } },
            evolutionPercentage: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            comparisonPoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  parameter: { type: Type.STRING },
                  oldVal: { type: Type.STRING },
                  newVal: { type: Type.STRING },
                  changeType: { type: Type.STRING, enum: ["better", "worse", "neutral"] }
                },
                required: ["parameter", "oldVal", "newVal", "changeType"]
              }
            }
          },
          required: ["improved", "worsened", "evolutionPercentage", "summary", "comparisonPoints"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  },

  /**
   * Diagnósticos Diferenciais com base em todo o contexto do paciente.
   */
  async suggestDifferentialDiagnoses(patientData: any): Promise<AIDifferentialDiagnosisResult> {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Com base em todas as informações clínicas disponíveis do paciente, formule hipóteses diagnósticas diferenciais fundamentadas:
Dados Clínicos do Paciente:
${JSON.stringify(patientData, null, 2)}`
        }
      ],
      config: {
        systemInstruction: "Você é um clínico especialista sênior. Formule o diagnóstico mais provável e hipóteses alternativas detalhando a probabilidade de cada uma e a justificação clínica fundamentada na literatura médica.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mostProbable: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                probability: { type: Type.INTEGER },
                justification: { type: Type.STRING }
              },
              required: ["name", "probability", "justification"]
            },
            alternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  probability: { type: Type.INTEGER },
                  justification: { type: Type.STRING }
                },
                required: ["name", "probability", "justification"]
              }
            }
          },
          required: ["mostProbable", "alternatives"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  },

  /**
   * Avaliação de Medicações.
   */
  async evaluateMedications(patientProfile: any, currentMeds: string[], ongoingPrescriptions?: any[]): Promise<AIMedicationEvaluationResult> {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Avalie o perfil de medicamentos do paciente.
Perfil do Paciente: ${JSON.stringify(patientProfile, null, 2)}
Lista de Medicamentos em uso: ${currentMeds.join(', ')}
Receitas Registadas: ${JSON.stringify(ongoingPrescriptions, null, 2)}`
        }
      ],
      config: {
        systemInstruction: "Você é um farmacologista clínico e especialista médico sênior. Avalie o perfil de medicações, identificando interações medicamentosas graves, duplicações de terapia, contraindicações, doses potencialmente inadequadas e riscos específicos (hepático/renal). Sugira alertas de segurança para o médico.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            interactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  drugs: { type: Type.ARRAY, items: { type: Type.STRING } },
                  severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
                  description: { type: Type.STRING }
                },
                required: ["drugs", "severity", "description"]
              }
            },
            duplications: { type: Type.ARRAY, items: { type: Type.STRING } },
            contraindications: { type: Type.ARRAY, items: { type: Type.STRING } },
            inappropriateDoses: { type: Type.ARRAY, items: { type: Type.STRING } },
            renalRisk: { type: Type.STRING },
            hepaticRisk: { type: Type.STRING },
            alerts: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["interactions", "duplications", "contraindications", "inappropriateDoses", "renalRisk", "hepaticRisk", "alerts"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  },

  /**
   * Gera um relatório clínico estruturado e pronto para exportação.
   */
  async generateClinicalReport(patientContext: any, aiResults: any): Promise<AIClinicalReportResult> {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Gere um Relatório Clínico profissional compilando os seguintes dados:
Contexto do Paciente:
${JSON.stringify(patientContext, null, 2)}

Resultados de Análises Inteligentes:
${JSON.stringify(aiResults, null, 2)}`
        }
      ],
      config: {
        systemInstruction: "Você é um assistente médico especialista de alto nível de uma clínica premium. Escreva um relatório clínico detalhado, profissional, elegante e formal adequado para partilhar com outros especialistas ou incluir no prontuário oficial.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            findings: { type: Type.STRING },
            interpretation: { type: Type.STRING },
            hypotheses: { type: Type.ARRAY, items: { type: Type.STRING } },
            plan: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            observations: { type: Type.STRING }
          },
          required: ["summary", "findings", "interpretation", "hypotheses", "plan", "recommendations", "observations"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  },

  /**
   * Responde a perguntas sobre o paciente no Chat Inteligente.
   */
  async askAICopilot(patientContext: any, messageHistory: { role: 'user' | 'model'; parts: { text: string }[] }[], question: string): Promise<AIChatResponse> {
    const ai = getAI();
    
    // Convert to proper structure
    const systemInstruction = `Você é o Copiloto Clínico Inteligente da plataforma THE DOCTA. Você ajuda o médico na tomada de decisões com base em evidências.
Você possui todo o histórico do paciente abaixo:
${JSON.stringify(patientContext, null, 2)}

Importante:
1. Responda de forma concisa, objetiva, científica e fundamentada na medicina moderna.
2. NUNCA mencione que você é apenas uma IA sem conhecimento físico ou que substitui um médico - o médico já sabe disso. Seja seu braço direito clínico.
3. Use formatação Markdown elegante para facilitar a leitura rápida.
4. Sugira sempre 3 perguntas relevantes complementares que o médico pode querer fazer a seguir.`;

    const chatContents = [...messageHistory];
    chatContents.push({
      role: 'user',
      parts: [{ text: question }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatContents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            response: { type: Type.STRING },
            suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["response", "suggestedQuestions"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }
};

export interface AILabExamResult {
  summary: string;
  mainAlterations: string[];
  alteredValues: { parameter: string; value: string; referenceRange: string; level: 'normal' | 'altered' | 'critical' }[];
  clinicalInterpretation: string;
  hypotheses: string[];
  differentialDiagnoses: string[];
  complementaryExams: string[];
  recommendations: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  limitations: string;
  confidence: number;
}

export interface AIImageExamResult {
  findings: string;
  conclusion: string;
  confidence: number;
  annotatedRegions?: string;
}

export interface AIExamComparisonResult {
  improved: string[];
  worsened: string[];
  evolutionPercentage: number;
  summary: string;
  comparisonPoints: { parameter: string; oldVal: string; newVal: string; changeType: 'better' | 'worse' | 'neutral' }[];
}

export interface AIDifferentialDiagnosisResult {
  mostProbable: { name: string; probability: number; justification: string };
  alternatives: { name: string; probability: number; justification: string }[];
}

export interface AIMedicationEvaluationResult {
  interactions: { drugs: string[]; severity: 'low' | 'medium' | 'high'; description: string }[];
  duplications: string[];
  contraindications: string[];
  inappropriateDoses: string[];
  renalRisk: string;
  hepaticRisk: string;
  alerts: string[];
}

export interface AIClinicalReportResult {
  summary: string;
  findings: string;
  interpretation: string;
  hypotheses: string[];
  plan: string;
  recommendations: string[];
  observations: string;
}

export interface AIChatResponse {
  response: string;
  suggestedQuestions: string[];
}
