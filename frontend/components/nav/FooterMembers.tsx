'use client';

import Link from 'next/link';
import { useState, type CSSProperties } from 'react';

export interface FooterMember {
  name: string;
  acronym: string | null;
  href: string | null;
  logo?: string;
  /** Color de su marca: solo se ve al pasar el cursor (fuera de su perfil, la marca no manda). */
  brand: string;
}

/**
 * Las nueve universidades en el pie, cada una con el logo que sube a su ficha en Strapi (versión
 * pequeña). Sin logo, o si el archivo no carga, su sigla ocupa el lugar. Cliente solo por el
 * respaldo del logo roto.
 */
export function FooterMembers({ members }: { members: FooterMember[] }) {
  return (
    <ul data-reveal-stagger="up" className="sf-unis__grid">
      {members.map((m) => (
        <li key={m.name}>
          <Member m={m} />
        </li>
      ))}
    </ul>
  );
}

function Member({ m }: { m: FooterMember }) {
  const [broken, setBroken] = useState(false);
  const logo = broken ? undefined : m.logo;
  const body = (
    <>
      <span className="sf-uni__logo">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo pequeño ya optimizado por Strapi; necesita onError
          <img src={logo} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />
        ) : (
          <span className="sf-uni__mono" aria-hidden>
            {(m.acronym ?? m.name).slice(0, 4)}
          </span>
        )}
      </span>
      <span className="sf-uni__acr">{m.acronym ?? ''}</span>
      <span className="sf-uni__name">{m.name}</span>
    </>
  );
  const style = { '--brand': m.brand } as CSSProperties;
  return m.href ? (
    <Link href={m.href} className="sf-uni" style={style}>
      {body}
    </Link>
  ) : (
    <span className="sf-uni" style={style}>
      {body}
    </span>
  );
}
