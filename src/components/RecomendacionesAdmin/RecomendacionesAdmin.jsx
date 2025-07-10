import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebaseConfig';
import {
    collection, addDoc, getDocs, updateDoc, doc, deleteDoc,
    serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Swal from 'sweetalert2';
import './RecomendacionesAdmin.css';

const MAX_RECOMENDACIONES = 10;
const MAX_ACTIVAS = 6;

const RecomendacionesAdmin = () => {
    const fileInputRef = useRef(null);
    const [recomendaciones, setRecomendaciones] = useState([]);
    const [imagenFile, setImagenFile] = useState(null);
    const [form, setForm] = useState({
        titulo: '',
        descripcion: '',
        precio: '',
        imagen: ''
    });

    useEffect(() => {
        const fetch = async () => {
            const q = query(collection(db, 'recomendaciones'), orderBy('orden'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map((doc, index) => ({
                id: doc.id,
                ...doc.data(),
                orden: doc.data().orden ?? index
            }));
            setRecomendaciones(data);
        };
        fetch();
    }, []);

    const handleChange = e => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

const crearRecomendacion = async () => {
    if (recomendaciones.length >= MAX_RECOMENDACIONES) {
        Swal.fire({
            title: 'Límite alcanzado',
            text: `Máximo ${MAX_RECOMENDACIONES} recomendaciones.`,
            icon: 'error',
            background: 'black',
            color: 'white',
            confirmButtonText: 'Ok',
        });
        return;
    }

    const { titulo, descripcion, precio } = form;
    if (!titulo || !descripcion || !precio) {
        Swal.fire({
            title: 'Campos incompletos',
            text: 'Completa todos los campos obligatorios.',
            icon: 'warning',
            background: 'black',
            color: 'white',
            confirmButtonText: 'Entendido',
        });
        return;
    }

    let imagenUrl = '';
    if (imagenFile) {
        try {
            imagenUrl = await subirImagen(imagenFile);
        } catch (error) {
            console.error("Error al subir imagen:", error);
            Swal.fire({
                title: 'Error al subir imagen',
                text: 'No se pudo subir la imagen. Intenta nuevamente.',
                icon: 'error',
                background: 'black',
                color: 'white',
                confirmButtonText: 'Cerrar',
            });
            return;
        }
    }

    const nueva = {
        ...form,
        imagen: imagenUrl,
        activo: false,
        timestamp: serverTimestamp(),
        orden: recomendaciones.length
    };

    const docRef = await addDoc(collection(db, 'recomendaciones'), nueva);
    setRecomendaciones(prev => [...prev, { id: docRef.id, ...nueva }]);
    setForm({ titulo: '', descripcion: '', precio: '', imagen: '' });
    setImagenFile(null);

    // ✅ Limpiar campo file input
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }

    Swal.fire({
        title: 'Recomendación guardada',
        text: 'Recuerda que puedes mostrar u ocultar las recomendaciones desde el panel, así como ordenar cuál quieres que se vea primero.',
        icon: 'success',
        background: 'black',
        color: 'white',
        confirmButtonText: 'Entendido',
    });
};


    const subirImagen = async (file) => {
        const storage = getStorage();
        const nombreUnico = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `recomendaciones/${nombreUnico}`);

        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    };

    const toggleActivo = async (id, actual) => {
        const activas = recomendaciones.filter(r => r.activo).length;
        if (!actual && activas >= MAX_ACTIVAS) {
            Swal.fire({
                title: 'Límite de visibles',
                text: `Solo puedes tener ${MAX_ACTIVAS} recomendaciones activas.`,
                icon: 'info',
                background: 'rgba(255, 255, 255, 0.6)',
                color: '#2c3e50',
                backdrop: 'rgba(0, 0, 0, 0.2)',
                customClass: {
                    popup: 'glass-popup',
                    confirmButton: 'glass-button'
                },
                confirmButtonText: 'Entendido'
                });
            return;
        }

        const refDoc = doc(db, 'recomendaciones', id);
        await updateDoc(refDoc, { activo: !actual });

        setRecomendaciones(prev =>
            prev.map(r => r.id === id ? { ...r, activo: !actual } : r)
        );
    };

    const eliminarRecomendacion = async (id) => {
    const confirm = await Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas eliminar esta recomendación?',
        icon: 'warning',
        background: 'black',
        color: 'white',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#4e73df',
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        customClass: {
        popup: 'glass-popup',
        confirmButton: 'glass-button',
        cancelButton: 'glass-button'
        }
    });

    if (confirm.isConfirmed) {
        try {
        await deleteDoc(doc(db, 'recomendaciones', id));
        setRecomendaciones(prev => {
            const nuevas = prev.filter(r => r.id !== id);
            return nuevas.map((r, i) => ({ ...r, orden: i }));
        });

        await Swal.fire({
            title: 'Recomendación eliminada',
            text: 'La recomendación ha sido eliminada correctamente.',
            icon: 'success',
            background: 'black',
            color: 'white',
            confirmButtonText: 'Ok',
            customClass: {
            popup: 'glass-popup',
            confirmButton: 'glass-button'
            }
        });
        } catch (error) {
        console.error('Error eliminando recomendación:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudo eliminar la recomendación.',
            icon: 'error',
            background: 'black',
            color: 'white',
            confirmButtonText: 'Ok',
            customClass: {
            popup: 'glass-popup',
            confirmButton: 'glass-button'
            }
        });
        }
    }
    };


    const moverRecomendacion = async (index, direccion) => {
        const nuevoIndex = index + direccion;
        if (nuevoIndex < 0 || nuevoIndex >= recomendaciones.length) return;

        const nuevas = [...recomendaciones];
        [nuevas[index], nuevas[nuevoIndex]] = [nuevas[nuevoIndex], nuevas[index]];

        // Actualizar orden en Firestore
        for (let i = 0; i < nuevas.length; i++) {
            nuevas[i].orden = i;
            await updateDoc(doc(db, 'recomendaciones', nuevas[i].id), { orden: i });
        }

        setRecomendaciones(nuevas);
    };

    return (
        <div className="recomendaciones-admin">
            <h2>Crear recomendación</h2>
            <div className="form-reco">
                <input
                    type="text"
                    placeholder="Título"
                    name="titulo"
                    value={form.titulo}
                    onChange={handleChange}
                />
                <textarea
                    placeholder="Descripción"
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                />
                <input
                    type="number"
                    placeholder="Precio"
                    name="precio"
                    value={form.precio}
                    onChange={handleChange}
                />
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => setImagenFile(e.target.files[0])}
                />
                <button onClick={crearRecomendacion}>Guardar recomendación</button>
            </div>

            <h3>Recomendaciones creadas</h3>
            <ul className="lista-reco">
                {recomendaciones.map((r, index) => (
                    <li key={r.id} className={`reco-item ${r.activo ? 'activa' : ''}`}>
                    <span className="reco-titulo">{r.titulo}</span>
                    <span className="reco-precio">${r.precio}</span>
                    <div className="reco-actions">
                        <button onClick={() => moverRecomendacion(index, -1)}>↑</button>
                        <button onClick={() => moverRecomendacion(index, 1)}>↓</button>
                        <button onClick={() => eliminarRecomendacion(r.id)}>Eliminar</button>
                        <label className="reco-check">
                        <input
                            type="checkbox"
                            checked={r.activo}
                            onChange={() => toggleActivo(r.id, r.activo)}
                        />
                        Mostrar
                        </label>
                    </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RecomendacionesAdmin;
