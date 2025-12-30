import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebaseConfig";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, orderBy, Timestamp,} from "firebase/firestore";
import Swal from "sweetalert2";
import "./BloqueoAgenda.css";

const BloqueoAgenda = () => {
  const [profesional, setProfesional] = useState(null);
  const [bloqueos, setBloqueos] = useState([]);

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [tipo, setTipo] = useState("dia_completo");
  const [horaDesde, setHoraDesde] = useState("");
  const [horaHasta, setHoraHasta] = useState("");
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    const fetchProfesional = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(collection(db, "peluqueros"), where("uid", "==", user.uid));
      const snap = await getDocs(q);

      if (!snap.empty) {
        setProfesional({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
    };

    fetchProfesional();
  }, []);

  const fetchBloqueos = async (profId) => {
    const q = query(
      collection(db, "bloqueos"),
      where("uidPeluquero", "==", profId),
      orderBy("fechaDesde", "desc")
    );

    const snap = await getDocs(q);
    setBloqueos(
      snap.docs.map(d => ({ id: d.id, ...d.data() }))
    );
  };

  useEffect(() => {
    if (profesional) fetchBloqueos(profesional.id);
  }, [profesional]);

  const guardarBloqueo = async () => {
    if (!fechaDesde) {
      Swal.fire("Error", "Debes indicar una fecha", "error");
      return;
    }

    if (tipo === "rango_horario" && (!horaDesde || !horaHasta)) {
      Swal.fire("Error", "Debes indicar el horario", "error");
      return;
    }

    try {
      await addDoc(collection(db, "bloqueos"), {
        uidPeluquero: profesional.id,
        fechaDesde,
        fechaHasta: fechaHasta || fechaDesde,
        tipo,
        horaDesde: tipo === "rango_horario" ? horaDesde : null,
        horaHasta: tipo === "rango_horario" ? horaHasta : null,
        motivo: motivo || null,
        createdAt: Timestamp.now(),
      });

      Swal.fire("Bloqueo creado", "La agenda fue bloqueada correctamente", "success");

      setFechaDesde("");
      setFechaHasta("");
      setHoraDesde("");
      setHoraHasta("");
      setMotivo("");
      setTipo("dia_completo");

      fetchBloqueos(profesional.id);
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "No se pudo guardar el bloqueo", "error");
    }
  };

  const eliminarBloqueo = async (id) => {
    const res = await Swal.fire({
      title: "Eliminar bloqueo",
      text: "¿Seguro que deseas eliminar este bloqueo?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!res.isConfirmed) return;

    await deleteDoc(doc(db, "bloqueos", id));
    fetchBloqueos(profesional.id);
  };

  return (
    <div className="bloqueo-container">
      <h2 className="bloqueo-title">Bloqueo de agenda</h2>
      <p className="bloqueo-text">Cada profesional debera registrar sus vacaciones / feriados y dia que no trabaje por algo en particular. Desde la administracion no se podra realizar bloqueos para cada profesional.</p>

      {profesional ? (
        <>
          {/* FORM */}
          <div className="bloqueo-card">
            <div className="bloqueo-item">
              <label>Profesional</label>
              <span className="bloqueo-nombre">{profesional.nombre}</span>
            </div>

            <div className="bloqueo-item">
              <label>Desde</label>
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
            </div>

            <div className="bloqueo-item">
              <label>Hasta</label>
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
            </div>

            <div className="bloqueo-item">
              <label>Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)}>
                <option value="dia_completo">Día completo</option>
                <option value="rango_horario">Por horario</option>
              </select>
            </div>

            {tipo === "rango_horario" && (
              <div className="bloqueo-horarios">
                <input type="time" value={horaDesde} onChange={e => setHoraDesde(e.target.value)} />
                <input type="time" value={horaHasta} onChange={e => setHoraHasta(e.target.value)} />
              </div>
            )}

            <div className="bloqueo-item">
              <label>Motivo (opcional)</label>
              <input
                type="text"
                placeholder="Vacaciones, trámite, capacitación..."
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
              />
            </div>

            <button className="bloqueo-button" onClick={guardarBloqueo}>
              Guardar bloqueo
            </button>
          </div>

          {/* LISTADO */}
          <div className="bloqueo-list">
            <h3>Bloqueos registrados</h3>

            {bloqueos.length === 0 && <p>No hay bloqueos cargados</p>}

            {bloqueos.map(b => (
              <div className="bloqueo-list-item" key={b.id}>
                <div>
                  <strong>{b.fechaDesde}</strong>
                  {b.fechaHasta !== b.fechaDesde && ` → ${b.fechaHasta}`}
                  {b.tipo === "rango_horario" && (
                    <> ({b.horaDesde} - {b.horaHasta})</>
                  )}
                  {b.motivo && <div className="bloqueo-motivo">{b.motivo}</div>}
                </div>
                <button onClick={() => eliminarBloqueo(b.id)}>Eliminar</button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p>Cargando profesional...</p>
      )}
    </div>
  );
};

export default BloqueoAgenda;
