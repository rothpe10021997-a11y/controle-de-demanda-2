
import React, { useState } from 'react';
import { ProductionState } from '../types';

interface Props {
  state: ProductionState;
  onImport: (state: ProductionState) => void;
}

const ScenarioManager: React.FC<Props> = ({ state, onImport }) => {
  const [importText, setImportText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const scenarioJson = JSON.stringify(state, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(scenarioJson);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      // Validação básica
      if (parsed.models && parsed.productionData) {
        onImport(parsed);
        alert("Cenário importado com sucesso!");
      } else {
        throw new Error("Formato inválido");
      }
    } catch (e) {
      alert("Falha na importação. Certifique-se de que o código colado é um JSON de cenário válido.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Export Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col">
        <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2 mb-4">
          <i className="fas fa-file-export text-blue-500"></i> Exportar Cenário Atual
        </h3>
        <p className="text-slate-400 text-xs mb-4">
          Copie o código abaixo para salvar o estado atual do sistema. Você pode guardá-lo em um arquivo de texto para uso futuro.
        </p>
        <div className="relative flex-1">
          <textarea 
            readOnly 
            value={scenarioJson}
            className="w-full h-[400px] bg-slate-900 border border-slate-700 rounded-xl p-4 text-[10px] font-mono text-blue-300 outline-none resize-none"
          />
          <button 
            onClick={handleCopy}
            className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg"
          >
            <i className={`fas ${copySuccess ? 'fa-check' : 'fa-copy'}`}></i>
            {copySuccess ? 'COPIADO!' : 'COPIAR CÓDIGO'}
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col">
        <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2 mb-4">
          <i className="fas fa-file-import text-purple-500"></i> Importar Cenário
        </h3>
        <p className="text-slate-400 text-xs mb-4">
          Cole o código JSON de um cenário salvo anteriormente para restaurar todos os dados e configurações.
        </p>
        <textarea 
          placeholder="Cole o JSON do cenário aqui..."
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          className="w-full h-[400px] bg-slate-900 border border-slate-700 rounded-xl p-4 text-[10px] font-mono text-purple-300 outline-none resize-none focus:ring-1 focus:ring-purple-500"
        />
        <button 
          onClick={handleImport}
          className="mt-4 w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl transition-all shadow-lg hover:shadow-purple-900/20 uppercase tracking-widest"
        >
          Carregar Cenário Colado
        </button>
      </div>
    </div>
  );
};

export default ScenarioManager;
