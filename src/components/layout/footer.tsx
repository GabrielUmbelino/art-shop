import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
  YoutubeIcon,
} from '@/components/brand-icons'
import { ComingSoon } from '@/components/coming-soon'

const features = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const socials = [
  { label: 'Facebook', Icon: FacebookIcon },
  { label: 'Instagram', Icon: InstagramIcon },
  { label: 'Twitter', Icon: TwitterIcon },
  { label: 'LinkedIn', Icon: LinkedinIcon },
  { label: 'YouTube', Icon: YoutubeIcon },
]

const linkClass = 'tracking-wide hover:text-highlight'

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold tracking-wide">{title}</h2>
      <ul className="flex flex-col gap-2 text-sm">{children}</ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="mt-24 pb-24 md:pb-0">
      <div className="page-container">
        <div className="bg-card">
          <section
            aria-label="Destaques"
            className="grid grid-cols-1 gap-8 px-6 py-8 md:grid-cols-2 md:px-12 lg:grid-cols-4 lg:gap-0"
          >
            {features.map((f) => (
              <div
                key={f.letter}
                className="flex flex-col gap-3 lg:border-r lg:border-primary lg:pr-6 lg:not-first:pl-6"
              >
                <span
                  aria-hidden="true"
                  className="flex size-[74px] items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
                >
                  {f.letter}
                </span>
                <h2 className="text-base font-bold tracking-wide">{f.title}</h2>
                <p className="text-sm leading-relaxed tracking-wide text-primary">{f.text}</p>
              </div>
            ))}
            <form
              className="flex flex-col gap-3 lg:pl-6"
              onSubmit={(e) => {
                e.preventDefault()
                toast.info('Em breve: a newsletter não faz parte desta demonstração.')
              }}
            >
              <h2 className="text-lg leading-tight font-bold tracking-wide">
                Antecipe-se ao próximo lançamento
              </h2>
              <div className="flex">
                <label htmlFor="newsletter-email" className="sr-only">
                  E-mail para a newsletter
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="digite seu e-mail..."
                  className="h-10 min-w-0 flex-1 rounded-l-sm bg-strip px-3 text-sm placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-ring"
                />
                <button
                  type="submit"
                  className="h-10 rounded-r-sm bg-primary px-4 text-lg font-bold text-primary-foreground hover:bg-highlight"
                >
                  Enviar
                </button>
              </div>
              <p className="text-xs leading-relaxed tracking-wide text-primary">
                Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
              </p>
            </form>
          </section>

          <div className="grid gap-4 bg-strip px-8 py-6 text-sm tracking-wide md:grid-cols-2 md:items-center lg:grid-cols-4">
            <span className="font-bold tracking-[0.15em]">KURIO</span>
            <span>Feito para colecionadores, criadores e cultura</span>
            <a href="mailto:contato@email.com" className={linkClass}>
              contato@email.com
            </a>
            <a href="tel:+551140028922" className={linkClass}>
              +55 11 4002 8922
            </a>
          </div>

          <div className="grid gap-8 px-8 py-8 sm:grid-cols-2 lg:grid-cols-4">
            <Column title="Meu perfil">
              <li>
                <Link to="/profile" className={linkClass}>
                  Meu perfil
                </Link>
              </li>
              <li>
                <ComingSoon className={linkClass}>Minha coleção</ComingSoon>
              </li>
              <li>
                <ComingSoon className={linkClass}>Atividade</ComingSoon>
              </li>
              <li>
                <ComingSoon className={linkClass}>Estúdio do criador</ComingSoon>
              </li>
              <li>
                <Link to="/favorites" className={linkClass}>
                  Lista de interesse
                </Link>
              </li>
            </Column>
            <Column title="Central de ajuda">
              {[
                'Central de ajuda',
                'Como comprar NFTs',
                'Carteira e segurança',
                'Política do mercado',
                'Denunciar item',
              ].map((label) => (
                <li key={label}>
                  <ComingSoon className={linkClass}>{label}</ComingSoon>
                </li>
              ))}
            </Column>
            <Column title="Coleções">
              {['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'].map((label) => (
                <li key={label}>
                  <Link to="/" hash="mercado" className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </Column>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <h2 className="text-lg font-bold tracking-wide">Redes sociais</h2>
                <ul className="flex gap-2">
                  {socials.map(({ label, Icon }) => (
                    <li key={label}>
                      <ComingSoon
                        aria-label={label}
                        className="flex size-8 items-center justify-center rounded-sm border border-primary text-primary hover:text-highlight"
                      >
                        <Icon className="size-4" />
                      </ComingSoon>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3">
                <h2 className="text-lg font-bold tracking-wide">Carteiras compatíveis</h2>
                <p className="w-fit rounded-sm border border-border bg-strip px-3 py-1 text-[10px] font-bold tracking-wide text-highlight">
                  METAMASK · WALLETCONNECT · COINBASE
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="py-6 text-center text-sm tracking-wide">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}
