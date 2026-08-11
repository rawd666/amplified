import ReviewForm from '../../components/ReviewForm';

export default function WriteReview() {
  return (
    <section className="section">
      <div className="shell">
        <div className="section__head">
          <div>
            <p className="stencil">Reviews</p>
            <h1 className="headline headline--lg">Write a review</h1>
          </div>
        </div>
        <ReviewForm />
      </div>
    </section>
  );
}
