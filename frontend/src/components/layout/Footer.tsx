import zoroSignature from '../../assets/zoro-made-this.png';

interface FooterProps {
  className?: string;
}

export function Footer({ className = '' }: FooterProps) {
  return (
    <footer className={`w-full py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-200/60 mt-8 ${className}`}>
      <p className="font-medium">© {new Date().getFullYear()} Ceylon Electricity Board — Tender Management System</p>
      <div className="flex items-center gap-2">
        <a
          href="https://skpthiran.github.io/Thiran-Wijesingha-portfolio/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center opacity-70 hover:opacity-100 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded"
          title="Site built by Zoro"
        >
          <img
            src={zoroSignature}
            alt="Site built by Zoro"
            className="w-32 max-w-[140px] h-auto object-contain"
          />
        </a>
      </div>
    </footer>
  );
}
