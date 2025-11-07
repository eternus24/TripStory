import axios from 'axios';

export const getAiTrip = async (data) => {
  const res = await axios.post('/api/ai/trip', data);
  return res.data;
};
