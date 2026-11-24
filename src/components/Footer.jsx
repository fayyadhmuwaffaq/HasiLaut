export default function Footer() {
  return (
    <footer className="w-full border-t border-[#075985] bg-[#0369A1]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="space-y-1">
          <p className="text-[20px] font-bold text-[#FFFFFF]">HasiLaut</p>
          <p className="max-w-[56ch] text-[15px] text-[#E0F2FE]">
            Platform jual beli hasil laut segar langsung dari nelayan dan mitra
            pesisir dalam satuan kilogram.
          </p>
        </div>

        <div className="border-t border-[#0284C7] pt-4 text-[14px] text-[#E0F2FE]">
          <p>HasiLaut Indonesia</p>
        </div>
      </div>
    </footer>
  );
}
