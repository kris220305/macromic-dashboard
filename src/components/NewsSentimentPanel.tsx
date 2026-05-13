import { useQuery } from "@tanstack/react-query";
import { Newspaper, ExternalLink, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { fetchNewsSentiment, aggregateSentiment, type NewsItem } from "@/lib/news-sentiment";

// For display count
const RSS_FEEDS_COUNT = 12;

function SentimentBadge({ sentiment }: { sentiment: NewsItem["sentiment"] }) {
  const styles = {
    positive: "bg-success/10 text-success",
    negative: "bg-destructive/10 text-destructive",
    neutral: "bg-muted text-muted-foreground",
  };
  const icons = {
    positive: TrendingUp,
    negative: TrendingDown,
    neutral: Minus,
  };
  const Icon = icons[sentiment];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[sentiment]}`}>
      <Icon className="h-3 w-3" />
      {sentiment}
    </span>
  );
}

export function NewsSentimentPanel() {
  const { data: news = [], isLoading } = useQuery({
    queryKey: ["news-sentiment"],
    queryFn: fetchNewsSentiment,
    staleTime: 5 * 60 * 1000,
  });

  const agg = aggregateSentiment(news);

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Sentimen Berita Ekonomi</h3>
        </div>
        {news.length > 0 && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">{agg.sourceCount} sumber</span>
            <span className="px-2 py-1 rounded-full bg-success/10 text-success font-bold">
              +{agg.positive}
            </span>
            <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground font-bold">
              {agg.neutral}
            </span>
            <span className="px-2 py-1 rounded-full bg-destructive/10 text-destructive font-bold">
              -{agg.negative}
            </span>
            <span className={`font-bold ${agg.avg > 0.1 ? "text-success" : agg.avg < -0.1 ? "text-destructive" : "text-muted-foreground"}`}>
              {agg.label}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Headline berita ekonomi dari {RSS_FEEDS_COUNT} sumber terpercaya (CNBC Indonesia, Bisnis.com, Kompas, Detik, Liputan6, Tempo, Katadata, Kontan, BBC, NYT, Reuters, FT) dengan analisis sentimen keyword-based.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : news.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Tidak dapat memuat berita saat ini. RSS feed mungkin tidak tersedia.
        </p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {news.map((item, idx) => (
            <div key={idx} className="rounded-xl border bg-background p-3 flex items-start gap-3 hover:bg-accent/30 transition">
              <div className="flex-1 min-w-0">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium hover:text-primary transition line-clamp-2"
                >
                  {item.title}
                </a>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{item.source}</span>
                  <span>·</span>
                  <span>{new Date(item.pubDate).toLocaleDateString("id-ID")}</span>
                </div>
              </div>
              <SentimentBadge sentiment={item.sentiment} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
