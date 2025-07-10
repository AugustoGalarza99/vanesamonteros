import React, { useState } from 'react';
import './PanelAdministrativo.css';

const PanelAdministrativo = ({ titulo, children }) => {
    const [abierto, setAbierto] = useState(false);

    return (
        <div className="panel-admin">
            <div className="panel-header" onClick={() => setAbierto(!abierto)}>
                <h3>{titulo}</h3>
                <span>{abierto ? '▲' : '▼'}</span>
            </div>
            {abierto && <div className="panel-body">{children}</div>}
        </div>
    );
};

export default PanelAdministrativo;
