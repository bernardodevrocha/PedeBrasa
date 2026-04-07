interface Churrasqueiro {
  name: string;
  imgChurrasqueiro?: string | null;
}

function ImageSlot({
  churrasqueiro,
}: {
  churrasqueiro: Churrasqueiro;
}) {
  if (churrasqueiro.imgChurrasqueiro) {
    return (
      <img
        src={churrasqueiro.imgChurrasqueiro}
        alt={`Foto de ${churrasqueiro.name}`}
        className="churrasqueiro-card-image"
      />
    );
  }

  return (
    <div className="churrasqueiro-card-image placeholder-image">
      <span>{churrasqueiro.name.slice(0, 1).toUpperCase()}</span>
    </div>
  );
}