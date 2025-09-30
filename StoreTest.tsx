import React from 'react';
import { useHealthStore } from './stores/useHealthStore';

const StoreTest: React.FC = () => {
  console.log('StoreTest component rendering...');

  try {
    const { theme, patients, selectedPatientId } = useHealthStore();
    console.log('Store data:', { theme, patients, selectedPatientId });

    return (
      <div style={{ padding: '20px', fontSize: '24px', color: 'blue' }}>
        <h1>Store Test is Working!</h1>
        <p>Theme: {theme}</p>
        <p>Patients count: {patients?.length || 0}</p>
        <p>Selected patient: {selectedPatientId || 'None'}</p>
      </div>
    );
  } catch (error) {
    console.error('Error in StoreTest:', error);
    return (
      <div style={{ padding: '20px', fontSize: '24px', color: 'red' }}>
        <h1>Store Error!</h1>
        <p>Error: {error instanceof Error ? error.message : String(error)}</p>
      </div>
    );
  }
};

export default StoreTest;