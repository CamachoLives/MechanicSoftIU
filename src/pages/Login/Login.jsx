import { useState } from "react";
import { TbUser, TbLock, TbEye, TbEyeOff, TbLogin2, TbShieldCheck, TbAlertCircle, TbMotorbike } from "react-icons/tb";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import "./Login.css";

// Coinciden con lo que siembra DatosInicialesRunner en el backend al arrancar por primera vez.
const USUARIOS_PRUEBA = [
    { usuario: "admin", contrasena: "admin123", nombre: "Laura Gómez", rol: "Administrador" },
    { usuario: "recepcion", contrasena: "recepcion123", nombre: "María Torres", rol: "Recepcionista" },
    { usuario: "mecanico", contrasena: "mecanico123", nombre: "Jorge Ramírez", rol: "Mecánico" },
];

export default function Login() {
    const { login } = useAuth();

    const [usuario, setUsuario] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    const intentarIngresar = async (usuarioIntento, contrasenaIntento) => {
        setCargando(true);
        setError("");

        const resultado = await login(usuarioIntento, contrasenaIntento);

        if (!resultado.ok) {
            setError(resultado.error);
            setCargando(false);
        }
        // Si el login es exitoso, App.jsx detecta la sesión y reemplaza esta pantalla.
    };

    const alEnviar = (e) => {
        e.preventDefault();
        intentarIngresar(usuario, contrasena);
    };

    const ingresarComoPrueba = (credencial) => {
        setUsuario(credencial.usuario);
        setContrasena(credencial.contrasena);
        intentarIngresar(credencial.usuario, credencial.contrasena);
    };

    return (
        <div className="login-pantalla fondo-grid">
            <div className="login-blob login-blob-1" />
            <div className="login-blob login-blob-2" />
            <div className="login-blob login-blob-3" />

            <div className="login-contenido">
                <div className="login-marca">
                    <span className="login-marca-icono">
                        <TbMotorbike />
                    </span>
                    <div>
                        <h1 className="texto-glow login-marca-titulo">MechanicSoft</h1>
                        <p className="login-marca-subtitulo">Panel de control del taller</p>
                    </div>
                </div>

                <div className="login-panel panel-cristal">
                    <h2 className="login-panel-titulo">Iniciar sesión</h2>
                    <p className="login-panel-descripcion">
                        Ingresa tus credenciales para acceder al sistema.
                    </p>

                    <form className="login-formulario" onSubmit={alEnviar}>
                        <Input
                            label="Usuario"
                            icono={<TbUser />}
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            placeholder="ej. jorge.mecanico"
                            autoComplete="username"
                            required
                        />

                        <Input
                            label="Contraseña"
                            icono={<TbLock />}
                            type={mostrarContrasena ? "text" : "password"}
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                            accionFinal={
                                <button
                                    type="button"
                                    onClick={() => setMostrarContrasena((v) => !v)}
                                    aria-label={
                                        mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"
                                    }
                                >
                                    {mostrarContrasena ? <TbEyeOff /> : <TbEye />}
                                </button>
                            }
                        />

                        {error && (
                            <p className="login-error">
                                <TbAlertCircle /> {error}
                            </p>
                        )}

                        <Button type="submit" anchoCompleto icono={<TbLogin2 />} disabled={cargando}>
                            {cargando ? "Verificando..." : "Ingresar"}
                        </Button>
                    </form>
                </div>

                <div className="login-prueba panel-cristal">
                    <h3>
                        <TbShieldCheck /> Usuarios de prueba
                    </h3>
                    <p className="login-prueba-nota">
                        Entorno de demostración: un clic inicia sesión con ese usuario. Las
                        contraseñas ya viven cifradas en la base de datos, pero la sesión sigue
                        siendo simple (sin tokens), pensada para desarrollo.
                    </p>
                    <div className="login-prueba-lista">
                        {USUARIOS_PRUEBA.map((credencial) => (
                            <button
                                type="button"
                                key={credencial.usuario}
                                className="login-prueba-item"
                                onClick={() => ingresarComoPrueba(credencial)}
                                disabled={cargando}
                            >
                                <span className="login-prueba-encabezado">
                                    <span className="login-prueba-nombre">{credencial.nombre}</span>
                                    <span className="login-prueba-rol">{credencial.rol}</span>
                                </span>
                                <span className="login-prueba-credenciales">
                                    {credencial.usuario} / {credencial.contrasena}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
