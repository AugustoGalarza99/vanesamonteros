import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Swal from "sweetalert2";
import './PerfilProfesional.css';

const PerfilProfesional = () => {
  const [profesional, setProfesional] = useState(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState("");
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    const fetchDatos = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(db, "peluqueros", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setProfesional({ id: snap.id, ...data });
        setWhatsapp(data.whatsapp || "");
        setFotoPerfil(data.fotoPerfil || "");
      }
    };

    fetchDatos();
  }, []);

  const actualizarWhatsapp = async () => {
    try {
      await updateDoc(doc(db, "peluqueros", profesional.id), { whatsapp });
      Swal.fire({
        title: 'WhatsApp actualizado',
        text: 'El número fue actualizado correctamente.',
        icon: 'success',
        background: 'black',
        color: 'white',
        confirmButtonText: 'Ok',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const subirImagen = async (file) => {
    try {
      setSubiendo(true);
      const storage = getStorage();
      const nombreUnico = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `perfiles/${nombreUnico}`);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "peluqueros", profesional.id), { fotoPerfil: url });
      setFotoPerfil(url);
      Swal.fire({
        title: 'Foto actualizada',
        text: 'Tu imagen de perfil fue actualizada con éxito.',
        icon: 'success',
        background: 'black',
        color: 'white',
        confirmButtonText: 'Ok',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubiendo(false);
    }
  };

  if (!profesional) return <div className="perfil-loading">Cargando perfil...</div>;

  return (
    <div className="perfil-container">
      <h2 className="perfil-title">Hola {profesional.nombre}</h2>

      <div className="perfil-card">
        <div className="perfil-img-container">
          <img src={fotoPerfil ? fotoPerfil : "/vanesamonterosfavicon.jpg"} alt="Perfil" className="perfil-img" />
          <label htmlFor="file-upload" className="perfil-input-file">
            Cambiar foto de perfil
            </label>
          <input
          id="file-upload"
            type="file"
            accept="image/*"
            onChange={(e) => subirImagen(e.target.files[0])}
            style={{ display: 'none' }}
          />
        </div>

        <div className="perfil-info">
          <label>Número de WhatsApp:</label>
          <input
            type="text"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="perfil-input"
          />
          <button className="perfil-button" onClick={actualizarWhatsapp}>Actualizar</button>
        </div>
      </div>
    </div>
  );
};

export default PerfilProfesional;
