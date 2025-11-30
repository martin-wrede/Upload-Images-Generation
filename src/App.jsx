import React, { useState } from 'react';


const PACKAGES = {
  test: { title: 'Test Package', limit: 2, description: 'Please upload 2 test images.', column: 'Image_Upload' },
  starter: { title: 'Starter Package', limit: 5, description: 'Please upload 5 images.', column: 'Image_Upload2' },
  normal: { title: 'Normal Package', limit: 10, description: 'Please upload 10 images.', column: 'Image_Upload2' },
  default: { title: 'Image Upload', limit: 10, description: 'Please upload your images.', column: 'Image_Upload2' }
};

function App() {
  const [prompt, setPrompt] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Get package from URL query parameter
  const queryParams = new URLSearchParams(window.location.search);
  const packageType = queryParams.get('package');
  const currentPackage = PACKAGES[packageType] || PACKAGES.default;

  const handleFileChange = (e) => {
    const selectedFiles = [...e.target.files];
    if (selectedFiles.length > currentPackage.limit) {
      alert(`You can only upload a maximum of ${currentPackage.limit} images for the ${currentPackage.title}.`);
      // Reset the input value so the user can try again
      e.target.value = '';
      setFiles([]);
    } else {
      setFiles(selectedFiles);
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('uploadColumn', currentPackage.column); // Send target column

      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/upload_images', {
        method: 'POST',
        body: formData, // Send FormData directly
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          alert(result.error);
          return;
        }
        throw new Error(result.error || "Upload failed");
      }

      console.log("✅ Uploaded to Airtable:", result);
      alert("Upload successful!");
    } catch (error) {
      console.error("❌ Error uploading to Airtable:", error);
      alert(error.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const generateImage = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          user: 'User123',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;
      console.log("OpenAI Response:", data);

      setResult(imageUrl);

      if (!imageUrl) throw new Error("Image URL missing in OpenAI response");

      // Save to Airtable
      await saveToAirtable(prompt, imageUrl, 'User123', email, files, currentPackage.column);

    } catch (error) {
      console.error("Error generating image:", error);
      alert("Error generating image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  const saveToAirtable = async (prompt, imageUrl, user = 'Anonymous', email = '', files = [], uploadColumn = 'Image_Upload2') => {
    console.log("📦 Saving to Airtable:", { prompt, imageUrl, user, email, files, uploadColumn });
    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('imageUrl', imageUrl);
      formData.append('user', user);
      formData.append('email', email);
      formData.append('uploadColumn', uploadColumn); // Send target column

      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/airtable', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log("✅ Saved to Airtable:", result);
    } catch (error) {
      console.error("❌ Error saving to Airtable:", error);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>{currentPackage.title}</h1>
      <p>{currentPackage.description}</p>

      <div style={{ marginBottom: '2rem', border: '1px solid #ccc', padding: '1rem' }}>
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ padding: '0.5rem', width: '300px', display: 'block', marginBottom: '0.5rem' }}
        />
        <input
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ padding: '0.5rem', width: '300px', display: 'block', marginBottom: '0.5rem' }}
        />
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          style={{ padding: '0.5rem', display: 'block', marginBottom: '0.5rem' }}
        />
        <button
          onClick={handleUpload}
          disabled={isUploading}
          style={{ padding: '0.5rem 1rem', marginTop: '0.5rem' }}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {/** AI image gneration starts here */}


      <hr style={{ margin: '2rem 0' }} />

      <h1>Generate or Modify Image with AI</h1>

      {files.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select an image to modify (optional):</label>
          <select
            onChange={(e) => {
              const selectedIndex = e.target.value;
              // Store selected file index or null
              // We'll just use a local variable or state if we wanted to be robust, 
              // but for now let's just read it from the select in generateImage or add a state.
              // Let's add a state for selectedImageIndex
            }}
            id="imageSelector"
            style={{ padding: '0.5rem', width: '300px' }}
          >
            <option value="">-- Create new image (No file) --</option>
            {files.map((file, index) => (
              <option key={index} value={index}>
                {file.name}
              </option>
            ))}
          </select>
          <p style={{ fontSize: '0.8rem', color: '#666' }}>
            * You don't need to upload to Airtable first. Just select a file above.
          </p>
        </div>
      )}

      <input
        type="text"
        placeholder="Enter your prompt (e.g. 'make sky blue')"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        style={{ padding: '0.5rem', width: '300px' }}
      />
      <button
        onClick={async () => {
          setIsLoading(true);
          try {
            const imageSelector = document.getElementById('imageSelector');
            const selectedIndex = imageSelector ? imageSelector.value : "";
            const selectedFile = selectedIndex !== "" ? files[selectedIndex] : null;

            let body;
            let headers = {};

            if (selectedFile) {
              const formData = new FormData();
              formData.append('prompt', prompt);
              formData.append('image', selectedFile);
              formData.append('user', 'User123');
              body = formData;
              // Fetch automatically sets Content-Type to multipart/form-data with boundary
            } else {
              body = JSON.stringify({
                prompt,
                user: 'User123',
              });
              headers['Content-Type'] = 'application/json';
            }

            const response = await fetch('/ai', {
              method: 'POST',
              headers: headers,
              body: body,
            });

            if (!response.ok) {
              const errData = await response.json();
              throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const imageUrl = data.data?.[0]?.url;
            console.log("OpenAI Response:", data);

            setResult(imageUrl);

            if (!imageUrl) throw new Error("Image URL missing in OpenAI response");

            // Save to Airtable (optional, keeping existing logic)
            // Note: If we modified an image, we might want to save that context, but for now just saving the result.
            await saveToAirtable(prompt, imageUrl, 'User123', email, files, currentPackage.column);

          } catch (error) {
            console.error("Error generating image:", error);
            alert(`Error generating image: ${error.message}`);
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={isLoading}
        style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}
      >

        {isLoading ? 'Processing...' : 'Generate / Modify'}
      </button>

      {result && (
        <div style={{ marginTop: '2rem' }}>
          <img src={result} alt="Generated" style={{ maxWidth: '100%', height: 'auto' }} />
        </div>
      )}

    </div>
  );
}

export default App;