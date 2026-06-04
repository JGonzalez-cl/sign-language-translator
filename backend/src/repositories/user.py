from sqlalchemy import select, update, func, cast, Date, Integer, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import Rol, Usuario, UserStatus
from src.models.session import SesionTraduccion, SesionStatus
from src.models.result import Resultado, DetalleResultado

from datetime import UTC


class UserRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: int) -> Usuario | None:
        result = await self.db.execute(
            select(Usuario).where(Usuario.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Usuario | None:
        result = await self.db.execute(
            select(Usuario).where(Usuario.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_nombre_usuario(self, nombre_usuario: str) -> Usuario | None:
        result = await self.db.execute(
            select(Usuario).where(Usuario.nombre_usuario == nombre_usuario)
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 20) -> list[Usuario]:
        result = await self.db.execute(
            select(Usuario).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def count_all(self) -> int:
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count()).select_from(Usuario)
        )
        return result.scalar_one()

    async def create(self, email: str, password_hash: str, nombre_usuario: str,
                     nombre: str, apellidos: str, rol_id: int) -> Usuario:
        usuario = Usuario(
            email=email,
            password_hash=password_hash,
            nombre_usuario=nombre_usuario,
            nombre=nombre,
            apellidos=apellidos,
            rol_id=rol_id,
            status=UserStatus.ACTIVO,
        )
        self.db.add(usuario)
        await self.db.flush()
        await self.db.refresh(usuario)
        return usuario

    async def update(self, usuario: Usuario, **kwargs) -> Usuario:
        for key, value in kwargs.items():
            setattr(usuario, key, value)
        await self.db.flush()
        await self.db.refresh(usuario)
        return usuario

    async def delete(self, usuario: Usuario) -> None:
        await self.db.delete(usuario)
        await self.db.flush()

    async def get_rol_by_nombre(self, nombre: str) -> Rol | None:
        result = await self.db.execute(
            select(Rol).where(Rol.nombre == nombre)
        )
        return result.scalar_one_or_none()
    
    async def get_stats(self, usuario_id: int) -> dict:

        # Totales de sesiones
        totales = await self.db.execute(
            select(
                func.count(SesionTraduccion.id).label("total"),
                func.sum(
                    cast(SesionTraduccion.status == SesionStatus.COMPLETADA, Integer)
                ).label("completadas"),
                func.sum(
                    cast(SesionTraduccion.status == SesionStatus.INTERRUMPIDA, Integer)
                ).label("interrumpidas"),
            ).where(
                SesionTraduccion.usuario_id == usuario_id,
                SesionTraduccion.eliminado == False,
            )
        )
        row_totales = totales.one()

        # Confianza media y gestos detectados
        agregados = await self.db.execute(
            select(
                func.count(DetalleResultado.id).label("gestos_detectados"),
                func.avg(DetalleResultado.confianza).label("confianza_media"),
            )
            .join(Resultado, Resultado.id == DetalleResultado.resultado_id)
            .join(SesionTraduccion, SesionTraduccion.id == Resultado.sesion_id)
            .where(
                SesionTraduccion.usuario_id == usuario_id,
                SesionTraduccion.eliminado == False,
            )
        )
        row_agregados = agregados.one()

        # Gesto más detectado
        top_gesto = await self.db.execute(
            select(
                DetalleResultado.gesto,
                func.count(DetalleResultado.gesto).label("count"),
            )
            .join(Resultado, Resultado.id == DetalleResultado.resultado_id)
            .join(SesionTraduccion, SesionTraduccion.id == Resultado.sesion_id)
            .where(
                SesionTraduccion.usuario_id == usuario_id,
                SesionTraduccion.eliminado == False,
            )
            .group_by(DetalleResultado.gesto)
            .order_by(func.count(DetalleResultado.gesto).desc())
            .limit(1)
        )
        row_top = top_gesto.one_or_none()

        # Top 5 gestos
        top_gestos = await self.db.execute(
            select(
                DetalleResultado.gesto,
                func.count(DetalleResultado.gesto).label("count"),
            )
            .join(Resultado, Resultado.id == DetalleResultado.resultado_id)
            .join(SesionTraduccion, SesionTraduccion.id == Resultado.sesion_id)
            .where(
                SesionTraduccion.usuario_id == usuario_id,
                SesionTraduccion.eliminado == False,
            )
            .group_by(DetalleResultado.gesto)
            .order_by(func.count(DetalleResultado.gesto).desc())
            .limit(5)
        )

        # Distribución por modo
        por_modo = await self.db.execute(
            select(
                SesionTraduccion.modo,
                func.count(SesionTraduccion.id).label("count"),
            )
            .where(
                SesionTraduccion.usuario_id == usuario_id,
                SesionTraduccion.eliminado == False,
            )
            .group_by(SesionTraduccion.modo)
        )

        # Actividad últimos 30 días
        from datetime import datetime, timedelta
        desde = datetime.now(UTC) - timedelta(days=30)
        actividad = await self.db.execute(
            select(
                cast(SesionTraduccion.fecha, Date).label("fecha"),
                func.count(SesionTraduccion.id).label("count"),
            )
            .where(
                SesionTraduccion.usuario_id == usuario_id,
                SesionTraduccion.fecha >= desde,
                SesionTraduccion.eliminado == False,
            )
            .group_by(cast(SesionTraduccion.fecha, Date))
            .order_by(cast(SesionTraduccion.fecha, Date))
        )

        return {
            "total_sesiones":      row_totales.total or 0,
            "completadas":         row_totales.completadas or 0,
            "interrumpidas":       row_totales.interrumpidas or 0,
            "gestos_detectados":   row_agregados.gestos_detectados or 0,
            "confianza_media":     float(row_agregados.confianza_media or 0),
            "gesto_mas_detectado": row_top.gesto if row_top else None,
            "top_gestos": [
                {"gesto": r.gesto, "count": r.count}
                for r in top_gestos.all()
            ],
            "por_modo": {
                str(r.modo.value): r.count
                for r in por_modo.all()
            },
            "actividad_reciente": [
                {"fecha": str(r.fecha), "count": r.count}
                for r in actividad.all()
            ],
        }