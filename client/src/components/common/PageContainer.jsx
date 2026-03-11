function PageContainer({ title, children }) {
  return (
    <section className="page-container">
      <h1 className="page-container__title">{title}</h1>
      {children}
    </section>
  );
}

export default PageContainer;
