import { useState } from 'react';
import CreateMatchTab from './CreateMatchTab';
import WeekControlTab from './WeekControlTab';
import ManageResultsTab from './ManageResultsTab';
import CsvImportTab from './CsvImportTab';
import styles from './Admin.module.css';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'create' | 'weeks' | 'manage' | 'csv'>('create');

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        ⚙️ Panel de Administración
      </h2>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          onClick={() => setActiveTab('create')}
          className={`${styles.tabBtn} ${activeTab === 'create' ? styles.activeTab : ''}`}
        >
          ➕ Crear Partido Manual
        </button>
        <button 
          onClick={() => setActiveTab('weeks')}
          className={`${styles.tabBtn} ${activeTab === 'weeks' ? styles.activeTab : ''}`}
        >
          🔒 Control de Semanas (Abrir/Cerrar)
        </button>
        <button 
          onClick={() => setActiveTab('manage')}
          className={`${styles.tabBtn} ${activeTab === 'manage' ? styles.activeTab : ''}`}
        >
          Gestionar Resultados
        </button>
        <button 
          onClick={() => setActiveTab('csv')}
          className={`${styles.tabBtn} ${activeTab === 'csv' ? styles.activeTab : ''}`}
        >
          📁 Cargar CSV Temporada
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'create' && <CreateMatchTab />}
      {activeTab === 'weeks' && <WeekControlTab />}
      {activeTab === 'manage' && <ManageResultsTab />}
      {activeTab === 'csv' && <CsvImportTab />}
    </div>
  );
}
