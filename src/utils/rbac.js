export function tienePermiso(usuario, clave, { roles, grupos }) {
    if (!usuario || usuario.activo === false) return false;

    const rolPropio = roles.find((r) => r.id === usuario.rolId);
    if (rolPropio?.permisos.includes(clave)) return true;

    return grupos.some((g) => {
        if (!g.rolBonusId || !g.miembroIds.includes(usuario.id)) return false;
        const rolBonus = roles.find((r) => r.id === g.rolBonusId);
        return rolBonus?.permisos.includes(clave) ?? false;
    });
}

export function permisosEfectivos(usuario, { roles, grupos }) {
    if (!usuario) return [];

    const rolPropio = roles.find((r) => r.id === usuario.rolId);
    const propios = rolPropio?.permisos ?? [];

    const bonus = grupos
        .filter((g) => g.rolBonusId && g.miembroIds.includes(usuario.id))
        .flatMap((g) => roles.find((r) => r.id === g.rolBonusId)?.permisos ?? []);

    return [...new Set([...propios, ...bonus])];
}
