export class CreateReviewDto {
  readonly user: string;
  readonly item: string;
  readonly rating: number;
  readonly comment: string;
}
