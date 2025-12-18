import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1, { message: 'Kommentar darf nicht leer sein' })
  @MaxLength(2000, { message: 'Kommentar darf maximal 2000 Zeichen haben' })
  content: string;
}
