package storage

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/smithy-go"

	"github.com/analopesdev/lembra/backend/internal/modules/media/app"
)

type Config struct {
	Endpoint     string
	Region       string
	Bucket       string
	AccessKey    string
	SecretKey    string
	UsePathStyle bool
}

type Client struct {
	bucket    string
	awscfg    aws.Config
	endpoint  string
	pathStyle bool
	s3        *s3.Client
	presign   *s3.PresignClient
}

func New(cfg Config) *Client {
	region := cfg.Region
	if region == "" {
		region = "us-east-1"
	}
	awscfg := aws.Config{
		Region:      region,
		Credentials: credentials.NewStaticCredentialsProvider(cfg.AccessKey, cfg.SecretKey, ""),
	}
	c := newS3(awscfg, cfg.Endpoint, cfg.UsePathStyle)
	return &Client{
		bucket:    cfg.Bucket,
		awscfg:    awscfg,
		endpoint:  cfg.Endpoint,
		pathStyle: cfg.UsePathStyle,
		s3:        c,
		presign:   s3.NewPresignClient(c),
	}
}

func newS3(awscfg aws.Config, endpoint string, pathStyle bool) *s3.Client {
	if endpoint != "" {
		awscfg.BaseEndpoint = aws.String(endpoint)
	}
	return s3.NewFromConfig(awscfg, func(o *s3.Options) {
		o.UsePathStyle = pathStyle
	})
}

type publicHostKey struct{}

func WithPublicHost(ctx context.Context, host string) context.Context {
	return context.WithValue(ctx, publicHostKey{}, host)
}

func (c *Client) presignerFor(ctx context.Context) *s3.PresignClient {
	host, _ := ctx.Value(publicHostKey{}).(string)
	if host == "" || c.endpoint == "" {
		return c.presign
	}
	u, err := url.Parse(c.endpoint)
	if err != nil {
		return c.presign
	}
	if h, _, err := net.SplitHostPort(host); err == nil {
		host = h
	}
	if host == u.Hostname() {
		return c.presign
	}
	if port := u.Port(); port != "" {
		u.Host = net.JoinHostPort(host, port)
	} else {
		u.Host = host
	}
	return s3.NewPresignClient(newS3(c.awscfg, u.String(), c.pathStyle))
}

var _ app.Objects = (*Client)(nil)

func (c *Client) PresignPut(ctx context.Context, key, contentType string, ttl time.Duration) (string, error) {
	out, err := c.presignerFor(ctx).PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(c.bucket),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(ttl))
	if err != nil {
		return "", err
	}
	return out.URL, nil
}

func (c *Client) PresignGet(ctx context.Context, key string, ttl time.Duration) (string, error) {
	out, err := c.presignerFor(ctx).PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(ttl))
	if err != nil {
		return "", err
	}
	return out.URL, nil
}

func (c *Client) Exists(ctx context.Context, key string) (bool, error) {
	_, err := c.s3.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	})
	if err == nil {
		return true, nil
	}
	var api smithy.APIError
	if errors.As(err, &api) && (api.ErrorCode() == "NotFound" || api.ErrorCode() == "NoSuchKey") {
		return false, nil
	}
	var httpErr interface{ HTTPStatusCode() int }
	if errors.As(err, &httpErr) && httpErr.HTTPStatusCode() == http.StatusNotFound {
		return false, nil
	}
	return false, fmt.Errorf("head object: %w", err)
}
