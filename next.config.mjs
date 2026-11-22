/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Photo y bookImage leen /public con fs al renderizar. En Vercel, cuando una página
  // se regenera (revalidate / revalidatePath), /public no está en la función salvo que se incluya.
  outputFileTracingIncludes: {
    '/**': ['./public/images/**/*'],
  },
};

export default nextConfig;
