import React, { useEffect, useState } from 'react';
import axios from 'axios';

const App = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [fillerId, setFillerId] = useState(null); 

  useEffect(() => {
    const createFiller = async () => {
      try {
        const response = await axios.post('http://localhost:5000/filler', {
          filler_field: 'dummy value'
        });
        setFillerId(response.data.id);
        console.log('Filler created:', response.data);
      } catch (error) {
        console.error('Error creating filler:', error);
      }
    };

    createFiller();
  }, []);

  const handleImageChange = (event) => {
    setSelectedImage(event.target.files[0]);
  };

  const handleUploadImage = async () => {
    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const response = await axios.post('http://localhost:5000/recognize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setRecognizedText(response.data.text);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      <button onClick={handleUploadImage}>Upload Image</button>
      {recognizedText && <p>Recognized Text: {recognizedText}</p>}
      {fillerId && <p>Filler created with ID: {fillerId}</p>}
    </div>
  );
};

export default App;
