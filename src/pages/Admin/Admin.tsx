import { useState } from 'react';
import CreateMatchTab from './CreateMatchTab';
import WeekControlTab from './WeekControlTab';
import ManageResultsTab from './ManageResultsTab';
import CsvImportTab from './CsvImportTab';
import { Settings, Plus, Lock, ListTodo, FileUp } from 'lucide-react';
import styles from './Admin.module.css';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'create' | 'weeks' | 'manage' | 'csv'>('create');

  return (
    <div className={styles.container}>
      <h2 className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Settings size={28} color="var(--primary-nfl)" /> Panel de Administración
      </h2>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          onClick={() => setActiveTab('create')}
          className={`${styles.tabBtn} ${activeTab === 'create' ? styles.activeTab : ''}`}
        >
          <Plus size={16} /> Crear Partido Manual
        </button>
        <button 
          onClick={() => setActiveTab('weeks')}
          className={`${styles.tabBtn} ${activeTab === 'weeks' ? styles.activeTab : ''}`}
        >
          <Lock size={16} /> Control de Semanas (Abrir/Cerrar)
        </button>
        <button 
          onClick={() => setActiveTab('manage')}
          className={`${styles.tabBtn} ${activeTab === 'manage' ? styles.activeTab : ''}`}
        >
          <ListTodo size={16} /> Gestionar Resultados
        </button>
        <button 
          onClick={() => setActiveTab('csv')}
          className={`${styles.tabBtn} ${activeTab === 'csv' ? styles.activeTab : ''}`}
        >
          <FileUp size={16} /> Cargar CSV Temporada
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
