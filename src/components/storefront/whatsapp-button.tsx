"use client";

export function WhatsAppButton() {
  const phone = "923478913290";
  const message = encodeURIComponent("Hi! I have a question about ZainStore.pk");
  const href = `https://wa.me/${phone}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-24 right-4 md:bottom-8 md:right-6 z-50 flex items-center gap-2 group"
    >
      {/* Tooltip */}
      <span className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-white text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg">
        Chat with us
      </span>

      {/* Button */}
      <div className="w-14 h-14 rounded-full bg-[#25D366] shadow-xl flex items-center justify-center hover:scale-110 transition-transform duration-200 animate-bounce-slow">
        <svg viewBox="0 0 32 32" fill="white" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
          <path d="M16 2C8.268 2 2 8.268 2 16c0 2.522.672 4.888 1.848 6.93L2 30l7.28-1.818A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.6a11.56 11.56 0 01-5.896-1.614l-.424-.252-4.322 1.08 1.1-4.216-.276-.436A11.554 11.554 0 014.4 16C4.4 9.594 9.594 4.4 16 4.4S27.6 9.594 27.6 16 22.406 27.6 16 27.6zm6.318-8.578c-.344-.172-2.038-1.006-2.354-1.12-.316-.116-.546-.172-.776.172-.23.344-.89 1.12-1.09 1.35-.2.23-.4.258-.744.086-.344-.172-1.452-.536-2.766-1.708-1.022-.912-1.712-2.038-1.912-2.382-.2-.344-.022-.53.15-.702.156-.154.344-.4.516-.6.172-.2.23-.344.344-.574.116-.23.058-.43-.028-.602-.086-.172-.776-1.87-1.062-2.562-.28-.674-.566-.582-.776-.594l-.66-.012c-.23 0-.602.086-.918.43-.316.344-1.204 1.178-1.204 2.872s1.232 3.332 1.404 3.562c.172.23 2.426 3.704 5.878 5.19.822.354 1.464.566 1.964.724.824.262 1.574.224 2.168.136.66-.1 2.038-.832 2.324-1.636.286-.804.286-1.492.2-1.636-.086-.144-.316-.23-.66-.4z"/>
        </svg>
      </div>
    </a>
  );
}
