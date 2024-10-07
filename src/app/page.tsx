import ImageResizer from "@/components/ImageResizer";


export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Image Resizer</h1>
      <ImageResizer />
    </div>
  );
}
