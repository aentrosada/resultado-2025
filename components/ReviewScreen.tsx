import React from 'react';
import { ReportCardData } from '../types';

interface ReviewScreenProps {
  data: ReportCardData;
  onConfirm: () => void;
  onRetake: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ data, onConfirm, onRetake }) => {
  
  const ScoreRow = ({ label, score, minPass }: { label: string, score: number | null, minPass: number }) => {
    const isPass = score !== null && score >= minPass;
    return (
      <div className="flex justify-between items-center py-4 border-b border-gray-100 last:border-0">
        <span className="text-gray-700 font-bold text-sm text-left">{label}</span>
        <div className="flex items-center gap-2">
          {score !== null ? (
            <>
              <span className={`font-black text-xl ${isPass ? 'text-green-600' : 'text-red-500'}`}>
                {score}
              </span>
              {isPass ? 
                <i className="fas fa-check-circle text-[#25D366] text-xl"></i> : 
                <i className="fas fa-exclamation-circle text-red-500 text-xl"></i>
              }
            </>
          ) : (
            <span className="text-gray-400 text-sm italic">Não identificado</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r">
        <div className="flex">
          <div className="flex-shrink-0">
            <i className="fas fa-info-circle text-blue-500"></i>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700 leading-snug">
              A IA analisou seu print. Verifique se as notas abaixo conferem com o seu boletim.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 p-5">
        <h3 className="text-center font-black text-gray-800 uppercase tracking-wide mb-4 border-b pb-4 text-base">
          Resumo das Notas
        </h3>
        
        <ScoreRow label="Ciências da Natureza" score={data.naturalSciences} minPass={100} />
        <ScoreRow label="Ciências Humanas" score={data.humanSciences} minPass={100} />
        <ScoreRow label="Linguagens e Códigos" score={data.languages} minPass={100} />
        <ScoreRow label="Matemática" score={data.mathematics} minPass={100} />
        <ScoreRow label="Redação" score={data.essay} minPass={5} />
      </div>

      <div className="flex flex-col gap-3">
        <button 
          onClick={onConfirm}
          className="w-full bg-[#219653] hover:bg-[#1e874b] text-white font-black py-4 px-6 rounded-full shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 text-base"
        >
          <i className="fas fa-check"></i> CONFIRMAR E ENVIAR
        </button>
        
        <button 
          onClick={onRetake}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-full transition-colors text-sm"
        >
          A imagem não ficou boa? Tentar novamente
        </button>
      </div>
    </div>
  );
};