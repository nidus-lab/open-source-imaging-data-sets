export default function Container({ children }) {
   return (
      <div className={`mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8`}>
         {children}
      </div>
   )
}
