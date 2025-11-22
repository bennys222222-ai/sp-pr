const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export async function loadUFCData() {
  try {
    const response = await fetch(`${API_URL}/api/ufc/data`);
    if (!response.ok) {
      throw new Error('Failed to load UFC data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading UFC data:', error);
    return { events: [], fighters: {} };
  }
}