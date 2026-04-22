import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  useEffect(() => {
    console.error("404 Error:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="panel max-w-lg rounded-[36px] p-8 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-primary/60">404</p>
        <h1 className="mt-4 text-4xl font-black text-foreground">الصفحة غير موجودة</h1>
        <p className="mt-4 text-sm leading-8 text-foreground/60">الرابط غير صحيح أو الصفحة لم تُفعّل بعد.</p>
        <Link to="/" className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground">العودة للرئيسية</Link>
      </div>
    </main>
  );
};

export default NotFound;
