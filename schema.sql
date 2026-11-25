-- ============================================================================
-- HasiLaut PostgreSQL Complete Backup (Schema + Data)
-- Engine          : PostgreSQL (kompatibel pgAdmin Query Tool & psql CLI)
-- Usage (psql)    : psql -d hasilaut -f schema.sql
-- Usage (pgAdmin) : Buka Query Tool pada database target -> jalankan skrip ini
-- ============================================================================
--
-- PostgreSQL database dump
--


-- Dumped from database version 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)
-- Dumped by pg_dump version 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'pending_payment',
    'processing',
    'shipped',
    'completed',
    'cancelled'
);


--
-- Name: payment_method_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_method_type AS ENUM (
    'cod',
    'bank_transfer'
);


--
-- Name: seller_verification_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.seller_verification_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'seller',
    'buyer'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id integer NOT NULL,
    cart_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity_kg numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cart_items_quantity_kg_check CHECK ((quantity_kg >= 0.5))
);


--
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- Name: carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carts (
    id integer NOT NULL,
    buyer_id integer NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: carts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.carts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: carts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.carts_id_seq OWNED BY public.carts.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    product_name_snapshot character varying(150) NOT NULL,
    price_per_kg_snapshot numeric(12,2) NOT NULL,
    quantity_kg numeric(10,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    CONSTRAINT order_items_quantity_kg_check CHECK ((quantity_kg >= 0.5)),
    CONSTRAINT order_items_subtotal_check CHECK ((subtotal >= (0)::numeric))
);


--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    order_code character varying(50) NOT NULL,
    buyer_id integer NOT NULL,
    store_id integer NOT NULL,
    shipping_address_snapshot text NOT NULL,
    payment_method public.payment_method_type NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    status public.order_status DEFAULT 'pending_payment'::public.order_status NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT orders_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id integer NOT NULL,
    store_id integer NOT NULL,
    category_id integer NOT NULL,
    name character varying(150) NOT NULL,
    description text NOT NULL,
    price_per_kg numeric(12,2) NOT NULL,
    stock_kg numeric(10,2) DEFAULT 0 NOT NULL,
    image_url character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true NOT NULL,
    admin_disabled boolean DEFAULT false NOT NULL,
    CONSTRAINT products_price_per_kg_check CHECK ((price_per_kg >= (0)::numeric)),
    CONSTRAINT products_stock_kg_check CHECK ((stock_kg >= (0)::numeric))
);


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    order_item_id integer NOT NULL,
    buyer_id integer NOT NULL,
    product_id integer NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stores (
    id integer NOT NULL,
    seller_id integer NOT NULL,
    store_name character varying(100) NOT NULL,
    description text,
    dock_location character varying(150),
    store_image_url character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: stores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stores_id_seq OWNED BY public.stores.id;


--
-- Name: user_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_addresses (
    id integer NOT NULL,
    user_id integer NOT NULL,
    label character varying(50) NOT NULL,
    recipient_name character varying(100) NOT NULL,
    recipient_phone character varying(20) NOT NULL,
    full_address text NOT NULL,
    city character varying(100) NOT NULL,
    postal_code character varying(10),
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_addresses_id_seq OWNED BY public.user_addresses.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(120) NOT NULL,
    password_hash character varying(255) NOT NULL,
    phone_number character varying(20),
    role public.user_role DEFAULT 'buyer'::public.user_role NOT NULL,
    seller_status public.seller_verification_status,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    rejection_reason text,
    rejected_at timestamp with time zone,
    CONSTRAINT chk_seller_status_role CHECK ((((role = 'seller'::public.user_role) AND (seller_status IS NOT NULL)) OR ((role = ANY (ARRAY['admin'::public.user_role, 'buyer'::public.user_role])) AND (seller_status IS NULL))))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- Name: carts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts ALTER COLUMN id SET DEFAULT nextval('public.carts_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: stores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores ALTER COLUMN id SET DEFAULT nextval('public.stores_id_seq'::regclass);


--
-- Name: user_addresses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_addresses ALTER COLUMN id SET DEFAULT nextval('public.user_addresses_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.carts (id, buyer_id, updated_at) VALUES (69, 81, '2026-11-25 15:43:47.276971+08');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.categories (id, name, slug, created_at) VALUES (2, 'Ikan Karang', 'ikan-karang', '2026-11-16 23:20:30.974314+08');
INSERT INTO public.categories (id, name, slug, created_at) VALUES (3, 'Udang & Kepiting', 'udang-kepiting', '2026-11-16 23:20:30.977062+08');
INSERT INTO public.categories (id, name, slug, created_at) VALUES (4, 'Cumi & Kerang', 'cumi-kerang', '2026-11-16 23:20:30.979609+08');
INSERT INTO public.categories (id, name, slug, created_at) VALUES (5, 'Olahan Laut', 'olahan-laut', '2026-11-16 23:20:30.982037+08');


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.order_items (id, order_id, product_id, product_name_snapshot, price_per_kg_snapshot, quantity_kg, subtotal) VALUES (58, 52, 25, 'Ikan Bandeng', 50000.00, 2.00, 100000.00);
INSERT INTO public.order_items (id, order_id, product_id, product_name_snapshot, price_per_kg_snapshot, quantity_kg, subtotal) VALUES (59, 52, 48, 'Ikan Mairo', 25000.00, 1.00, 25000.00);
INSERT INTO public.order_items (id, order_id, product_id, product_name_snapshot, price_per_kg_snapshot, quantity_kg, subtotal) VALUES (60, 53, 48, 'Ikan Mairo', 25000.00, 4.00, 100000.00);
INSERT INTO public.order_items (id, order_id, product_id, product_name_snapshot, price_per_kg_snapshot, quantity_kg, subtotal) VALUES (62, 55, 59, 'Udang', 20000.00, 1.00, 20000.00);
INSERT INTO public.order_items (id, order_id, product_id, product_name_snapshot, price_per_kg_snapshot, quantity_kg, subtotal) VALUES (63, 56, 74, 'Kepiting', 25000.00, 1.00, 25000.00);
INSERT INTO public.order_items (id, order_id, product_id, product_name_snapshot, price_per_kg_snapshot, quantity_kg, subtotal) VALUES (64, 57, 74, 'Kepiting', 25000.00, 1.00, 25000.00);
INSERT INTO public.order_items (id, order_id, product_id, product_name_snapshot, price_per_kg_snapshot, quantity_kg, subtotal) VALUES (65, 58, 73, 'Kerang', 15000.00, 1.00, 15000.00);
INSERT INTO public.order_items (id, order_id, product_id, product_name_snapshot, price_per_kg_snapshot, quantity_kg, subtotal) VALUES (67, 60, 74, 'Kepiting', 25000.00, 1.00, 25000.00);
INSERT INTO public.order_items (id, order_id, product_id, product_name_snapshot, price_per_kg_snapshot, quantity_kg, subtotal) VALUES (68, 61, 75, 'Ikan Tuna', 12000.00, 1.00, 12000.00);
INSERT INTO public.order_items (id, order_id, product_id, product_name_snapshot, price_per_kg_snapshot, quantity_kg, subtotal) VALUES (69, 62, 59, 'Udang', 20000.00, 1.00, 20000.00);
INSERT INTO public.order_items (id, order_id, product_id, product_name_snapshot, price_per_kg_snapshot, quantity_kg, subtotal) VALUES (70, 63, 77, 'Ikan Tongkol', 23000.00, 1.00, 23000.00);
INSERT INTO public.order_items (id, order_id, product_id, product_name_snapshot, price_per_kg_snapshot, quantity_kg, subtotal) VALUES (71, 64, 103, 'testing', 10000.00, 1.00, 10000.00);
INSERT INTO public.order_items (id, order_id, product_id, product_name_snapshot, price_per_kg_snapshot, quantity_kg, subtotal) VALUES (72, 65, 103, 'testing', 10000.00, 1.00, 10000.00);
INSERT INTO public.order_items (id, order_id, product_id, product_name_snapshot, price_per_kg_snapshot, quantity_kg, subtotal) VALUES (73, 66, 122, 'Ikan Nemo', 10000.00, 1.00, 10000.00);
INSERT INTO public.order_items (id, order_id, product_id, product_name_snapshot, price_per_kg_snapshot, quantity_kg, subtotal) VALUES (20, 20, 25, 'Ikan Bandeng', 50000.00, 10.00, 500000.00);
INSERT INTO public.order_items (id, order_id, product_id, product_name_snapshot, price_per_kg_snapshot, quantity_kg, subtotal) VALUES (21, 21, 25, 'Ikan Bandeng', 50000.00, 2.00, 100000.00);
INSERT INTO public.order_items (id, order_id, product_id, product_name_snapshot, price_per_kg_snapshot, quantity_kg, subtotal) VALUES (22, 22, 25, 'Ikan Bandeng', 50000.00, 1.50, 75000.00);


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.orders (id, order_code, buyer_id, store_id, shipping_address_snapshot, payment_method, total_amount, status, created_at, updated_at) VALUES (52, 'HL-20261119-DBED2C', 81, 42, '[Dapur Malioboro] fayyadhmuwaffaq (0811098098)
Permata Sudiang Raya, Blok H11 No. 08, Makassar', 'cod', 125000.00, 'completed', '2026-11-19 15:00:45.545589+08', '2026-11-19 15:02:00.94724+08');
INSERT INTO public.orders (id, order_code, buyer_id, store_id, shipping_address_snapshot, payment_method, total_amount, status, created_at, updated_at) VALUES (53, 'HL-20261121-937BDF', 81, 42, '[Dapur Malioboro] fayyadhmuwaffaq (0811098098)
Permata Sudiang Raya, Blok H11 No. 08, Makassar', 'cod', 100000.00, 'cancelled', '2026-11-21 19:39:08.593148+08', '2026-11-21 19:39:32.810804+08');
INSERT INTO public.orders (id, order_code, buyer_id, store_id, shipping_address_snapshot, payment_method, total_amount, status, created_at, updated_at) VALUES (22, 'HL-20261118-7C44D2', 81, 42, '[Dapur Malioboro] fayyadhmuwaffaq (0811098098)
Permata Sudiang Raya, Blok H11 No. 08, Makassar', 'cod', 75000.00, 'completed', '2026-11-18 15:45:28.234995+08', '2026-11-18 17:10:56.100926+08');
INSERT INTO public.orders (id, order_code, buyer_id, store_id, shipping_address_snapshot, payment_method, total_amount, status, created_at, updated_at) VALUES (55, 'HL-20261123-2392C8', 81, 87, '[Dapur Malioboro] fayyadhmuwaffaq (0811098098)
Permata Sudiang Raya, Blok H11 No. 08, Makassar', 'bank_transfer', 20000.00, 'completed', '2026-11-23 11:10:42.252508+08', '2026-11-23 18:58:37.19325+08');
INSERT INTO public.orders (id, order_code, buyer_id, store_id, shipping_address_snapshot, payment_method, total_amount, status, created_at, updated_at) VALUES (56, 'HL-20261124-594CB3', 81, 87, '[Dapur Malioboro] fayyadhmuwaffaq (0811098098)
Permata Sudiang Raya, Blok H11 No. 08, Makassar', 'bank_transfer', 25000.00, 'completed', '2026-11-24 17:56:56.544868+08', '2026-11-24 17:58:10.88404+08');
INSERT INTO public.orders (id, order_code, buyer_id, store_id, shipping_address_snapshot, payment_method, total_amount, status, created_at, updated_at) VALUES (61, 'HL-20261124-38D175', 81, 42, '[Dapur Malioboro] fayyadhmuwaffaq (0811098098)
Permata Sudiang Raya, Blok H11 No. 08, Makassar', 'cod', 12000.00, 'completed', '2026-11-24 18:32:27.782829+08', '2026-11-24 18:34:24.924644+08');
INSERT INTO public.orders (id, order_code, buyer_id, store_id, shipping_address_snapshot, payment_method, total_amount, status, created_at, updated_at) VALUES (57, 'HL-20261124-47679F', 81, 87, '[Dapur Malioboro] fayyadhmuwaffaq (0811098098)
Permata Sudiang Raya, Blok H11 No. 08, Makassar', 'cod', 25000.00, 'completed', '2026-11-24 17:58:54.599345+08', '2026-11-24 17:59:16.979978+08');
INSERT INTO public.orders (id, order_code, buyer_id, store_id, shipping_address_snapshot, payment_method, total_amount, status, created_at, updated_at) VALUES (62, 'HL-20261124-DAAA38', 81, 87, '[Dapur Malioboro] fayyadhmuwaffaq (0811098098)
Permata Sudiang Raya, Blok H11 No. 08, Makassar', 'cod', 20000.00, 'completed', '2026-11-24 18:32:27.782829+08', '2026-11-24 18:34:27.040979+08');
INSERT INTO public.orders (id, order_code, buyer_id, store_id, shipping_address_snapshot, payment_method, total_amount, status, created_at, updated_at) VALUES (63, 'HL-20261124-C67838', 81, 93, '[Dapur Malioboro] fayyadhmuwaffaq (0811098098)
Permata Sudiang Raya, Blok H11 No. 08, Makassar', 'cod', 23000.00, 'completed', '2026-11-24 18:32:27.782829+08', '2026-11-24 18:34:29.075703+08');
INSERT INTO public.orders (id, order_code, buyer_id, store_id, shipping_address_snapshot, payment_method, total_amount, status, created_at, updated_at) VALUES (64, 'HL-20261124-C55115', 81, 87, '[Dapur Malioboro] fayyadhmuwaffaq (0811098098)
Permata Sudiang Raya, Blok H11 No. 08, Makassar', 'cod', 10000.00, 'completed', '2026-11-24 20:11:56.39647+08', '2026-11-24 20:13:30.310995+08');
INSERT INTO public.orders (id, order_code, buyer_id, store_id, shipping_address_snapshot, payment_method, total_amount, status, created_at, updated_at) VALUES (60, 'HL-20261124-1B3F2A', 81, 87, '[Dapur Malioboro] fayyadhmuwaffaq (0811098098)
Permata Sudiang Raya, Blok H11 No. 08, Makassar', 'cod', 25000.00, 'completed', '2026-11-24 18:22:05.990192+08', '2026-11-24 18:22:38.486472+08');
INSERT INTO public.orders (id, order_code, buyer_id, store_id, shipping_address_snapshot, payment_method, total_amount, status, created_at, updated_at) VALUES (58, 'HL-20261124-D5A604', 81, 87, '[Dapur Malioboro] fayyadhmuwaffaq (0811098098)
Permata Sudiang Raya, Blok H11 No. 08, Makassar', 'cod', 15000.00, 'completed', '2026-11-24 17:59:40.326365+08', '2026-11-24 18:22:45.60412+08');
INSERT INTO public.orders (id, order_code, buyer_id, store_id, shipping_address_snapshot, payment_method, total_amount, status, created_at, updated_at) VALUES (65, 'HL-20261125-A98210', 81, 87, '[Dapur Malioboro] fayyadhmuwaffaq (0811098098)
Permata Sudiang Raya, Blok H11 No. 08, Makassar', 'cod', 10000.00, 'completed', '2026-11-25 14:11:01.20747+08', '2026-11-25 14:12:20.272097+08');
INSERT INTO public.orders (id, order_code, buyer_id, store_id, shipping_address_snapshot, payment_method, total_amount, status, created_at, updated_at) VALUES (20, 'HL-20261117-7E52A6', 81, 42, '[Dapur] fayyadhmuwaffaq (0811098098)
Permata Sudiang Raya, Makassar', 'cod', 500000.00, 'completed', '2026-11-17 08:29:52.618653+08', '2026-11-17 08:31:14.405135+08');
INSERT INTO public.orders (id, order_code, buyer_id, store_id, shipping_address_snapshot, payment_method, total_amount, status, created_at, updated_at) VALUES (21, 'HL-20261118-DC7CC4', 81, 42, '[Dapur Malioboro] fayyadhmuwaffaq (0811098098)
Permata Sudiang Raya, Blok H11 No. 08, Makassar', 'bank_transfer', 100000.00, 'completed', '2026-11-18 15:30:49.880976+08', '2026-11-18 15:40:44.836267+08');
INSERT INTO public.orders (id, order_code, buyer_id, store_id, shipping_address_snapshot, payment_method, total_amount, status, created_at, updated_at) VALUES (66, 'HL-20261125-968210', 81, 87, '[Dapur Malioboro] fayyadhmuwaffaq (0811098098)
Permata Sudiang Raya, Blok H11 No. 08, Makassar', 'cod', 10000.00, 'completed', '2026-11-25 14:15:24.686888+08', '2026-11-25 14:16:59.361463+08');


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.products (id, store_id, category_id, name, description, price_per_kg, stock_kg, image_url, created_at, updated_at, is_active, admin_disabled) VALUES (76, 93, 3, 'Lobster', 'Lobster Merah', 35000.00, 24.00, '/uploads/products/ca3efbe4-e0bc-4534-9865-bb6c500c835b.webp', '2026-11-24 13:20:12.672421+08', '2026-11-24 13:20:12.672421+08', true, false);
INSERT INTO public.products (id, store_id, category_id, name, description, price_per_kg, stock_kg, image_url, created_at, updated_at, is_active, admin_disabled) VALUES (78, 93, 2, 'Ikan Kakap', 'Ikan Kakap', 12000.00, 34.00, '/uploads/products/c32f63a0-ec9b-4fe8-b688-3f4eb811ce64.webp', '2026-11-24 13:22:13.723261+08', '2026-11-24 13:22:13.723261+08', true, false);
INSERT INTO public.products (id, store_id, category_id, name, description, price_per_kg, stock_kg, image_url, created_at, updated_at, is_active, admin_disabled) VALUES (79, 93, 2, 'Ikan Tenggiri', 'Ikan Tenggiri', 10000.00, 27.00, '/uploads/products/28fef579-5b10-4df8-b9cd-2b402030ef65.webp', '2026-11-24 13:23:27.900677+08', '2026-11-24 13:23:27.900677+08', true, false);
INSERT INTO public.products (id, store_id, category_id, name, description, price_per_kg, stock_kg, image_url, created_at, updated_at, is_active, admin_disabled) VALUES (25, 42, 2, 'Ikan Bandeng', 'Ikan Baru diambil Nich', 50000.00, 4.50, '/uploads/products/2d2df6a7-fc69-4641-beae-6895f591a0f7.jpg', '2026-11-17 08:24:38.331293+08', '2026-11-19 15:00:45.545589+08', true, false);
INSERT INTO public.products (id, store_id, category_id, name, description, price_per_kg, stock_kg, image_url, created_at, updated_at, is_active, admin_disabled) VALUES (59, 87, 3, 'Udang', 'Udang baru ditangkap tadi sore', 20000.00, 3.00, '/uploads/products/3eb6ff28-bb5e-4adb-8469-a7bb45a6ad40.jpg', '2026-11-22 08:37:20.28256+08', '2026-11-24 19:53:32.261393+08', true, false);
INSERT INTO public.products (id, store_id, category_id, name, description, price_per_kg, stock_kg, image_url, created_at, updated_at, is_active, admin_disabled) VALUES (75, 42, 2, 'Ikan Tuna', 'Ikan Tuna Merah Biru', 12000.00, 22.00, '/uploads/products/29d7c96b-0d79-4235-be07-3722dc637809.webp', '2026-11-24 13:18:44.955291+08', '2026-11-24 18:32:27.782829+08', true, false);
INSERT INTO public.products (id, store_id, category_id, name, description, price_per_kg, stock_kg, image_url, created_at, updated_at, is_active, admin_disabled) VALUES (77, 93, 2, 'Ikan Tongkol', 'Tongkol Bongol', 23000.00, 11.00, '/uploads/products/7cefc727-2adb-49e3-bef5-d84f75dbeb32.webp', '2026-11-24 13:20:49.808269+08', '2026-11-24 18:32:27.782829+08', true, false);
INSERT INTO public.products (id, store_id, category_id, name, description, price_per_kg, stock_kg, image_url, created_at, updated_at, is_active, admin_disabled) VALUES (48, 42, 5, 'Ikan Mairo', 'Ikan mairo besar', 25000.00, 4.00, '/uploads/products/9f41cf2d-6bf8-415f-ad6e-6ffb1e465000.jpg', '2026-11-19 14:59:15.591674+08', '2026-11-21 19:39:32.810804+08', true, false);
INSERT INTO public.products (id, store_id, category_id, name, description, price_per_kg, stock_kg, image_url, created_at, updated_at, is_active, admin_disabled) VALUES (103, 87, 2, 'testing', 'jhskdhskjdf', 10000.00, 8.00, '/uploads/products/fca95d66-e946-4d4d-8d14-62abd1475323.png', '2026-11-24 20:10:34.518401+08', '2026-11-25 17:56:33.082233+08', false, true);
INSERT INTO public.products (id, store_id, category_id, name, description, price_per_kg, stock_kg, image_url, created_at, updated_at, is_active, admin_disabled) VALUES (122, 87, 2, 'Ikan Nemo', 'jkhkjhkj', 10000.00, 0.00, '/uploads/products/9781d025-8723-42d1-acdf-6ca4d481c503.png', '2026-11-25 14:15:09.864627+08', '2026-11-25 17:57:47.238252+08', false, false);
INSERT INTO public.products (id, store_id, category_id, name, description, price_per_kg, stock_kg, image_url, created_at, updated_at, is_active, admin_disabled) VALUES (73, 87, 4, 'Kerang', 'Kerang Baru diambil', 15000.00, 24.00, '/uploads/products/b522607c-d5b2-4ff5-a5c7-1269d8bbc0f0.webp', '2026-11-24 13:15:37.252864+08', '2026-11-24 19:53:31.592024+08', true, false);
INSERT INTO public.products (id, store_id, category_id, name, description, price_per_kg, stock_kg, image_url, created_at, updated_at, is_active, admin_disabled) VALUES (74, 87, 3, 'Kepiting', 'Kepiting Alaska', 25000.00, 28.00, '/uploads/products/922deba4-eeec-44ed-846a-7096db7829a9.webp', '2026-11-24 13:18:01.142828+08', '2026-11-24 21:11:17.143869+08', true, false);


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.reviews (id, order_item_id, buyer_id, product_id, rating, comment, created_at) VALUES (8, 20, 81, 25, 5, NULL, '2026-11-17 08:31:40.064285+08');
INSERT INTO public.reviews (id, order_item_id, buyer_id, product_id, rating, comment, created_at) VALUES (9, 21, 81, 25, 1, 'nda enak ikannya mas, tidak segar', '2026-11-18 15:41:09.42401+08');
INSERT INTO public.reviews (id, order_item_id, buyer_id, product_id, rating, comment, created_at) VALUES (17, 58, 81, 25, 3, 'hgjhgjh', '2026-11-19 17:16:54.516296+08');
INSERT INTO public.reviews (id, order_item_id, buyer_id, product_id, rating, comment, created_at) VALUES (18, 59, 81, 48, 4, 'hgjhgjg', '2026-11-19 17:17:00.609454+08');
INSERT INTO public.reviews (id, order_item_id, buyer_id, product_id, rating, comment, created_at) VALUES (19, 22, 81, 25, 4, NULL, '2026-11-24 18:33:53.085591+08');
INSERT INTO public.reviews (id, order_item_id, buyer_id, product_id, rating, comment, created_at) VALUES (20, 62, 81, 59, 5, NULL, '2026-11-24 18:33:58.997779+08');
INSERT INTO public.reviews (id, order_item_id, buyer_id, product_id, rating, comment, created_at) VALUES (21, 63, 81, 74, 5, 'Good', '2026-11-24 18:34:06.169339+08');
INSERT INTO public.reviews (id, order_item_id, buyer_id, product_id, rating, comment, created_at) VALUES (22, 64, 81, 74, 4, 'Mantap!', '2026-11-24 18:34:15.97387+08');
INSERT INTO public.reviews (id, order_item_id, buyer_id, product_id, rating, comment, created_at) VALUES (23, 65, 81, 73, 4, NULL, '2026-11-24 18:34:34.312093+08');
INSERT INTO public.reviews (id, order_item_id, buyer_id, product_id, rating, comment, created_at) VALUES (24, 67, 81, 74, 4, NULL, '2026-11-24 18:34:36.656406+08');
INSERT INTO public.reviews (id, order_item_id, buyer_id, product_id, rating, comment, created_at) VALUES (25, 68, 81, 75, 4, NULL, '2026-11-24 18:34:39.038222+08');
INSERT INTO public.reviews (id, order_item_id, buyer_id, product_id, rating, comment, created_at) VALUES (26, 69, 81, 59, 5, NULL, '2026-11-24 18:34:43.264459+08');
INSERT INTO public.reviews (id, order_item_id, buyer_id, product_id, rating, comment, created_at) VALUES (27, 70, 81, 77, 4, NULL, '2026-11-24 18:34:45.017762+08');
INSERT INTO public.reviews (id, order_item_id, buyer_id, product_id, rating, comment, created_at) VALUES (28, 71, 81, 103, 5, 'jhkjhk', '2026-11-24 20:13:38.06019+08');


--
-- Data for Name: stores; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.stores (id, seller_id, store_name, description, dock_location, store_image_url, created_at, updated_at) VALUES (42, 80, 'Juragan Ikan', 'Lapak yang menyediakan berbagai macam ikan segar dan fresh.', 'Pasar Central', '/uploads/stores/65eeb6c9-c614-41b8-82ed-dac8e5ba3b95.png', '2026-11-17 08:20:42.45422+08', '2026-11-25 18:46:36.163698+08');
INSERT INTO public.stores (id, seller_id, store_name, description, dock_location, store_image_url, created_at, updated_at) VALUES (87, 180, 'Juragan Dapur', NULL, NULL, NULL, '2026-11-21 06:58:44.910497+08', '2026-11-21 06:58:44.910497+08');
INSERT INTO public.stores (id, seller_id, store_name, description, dock_location, store_image_url, created_at, updated_at) VALUES (93, 194, 'Juragan Kepiting', NULL, NULL, NULL, '2026-11-23 11:30:01.016968+08', '2026-11-23 11:30:01.016968+08');


--
-- Data for Name: user_addresses; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_addresses (id, user_id, label, recipient_name, recipient_phone, full_address, city, postal_code, is_default, created_at) VALUES (16, 81, 'Dapur Malioboro', 'fayyadhmuwaffaq', '0811098098', 'Permata Sudiang Raya, Blok H11 No. 08', 'Makassar', NULL, true, '2026-11-17 08:29:43.456508+08');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, full_name, email, password_hash, phone_number, role, seller_status, created_at, updated_at, rejection_reason, rejected_at) VALUES (80, 'Arif Abdullah', 'nelayan@test.com', '$2b$12$/B7yaVfOYCPOzpBo/DyX4.wT82T9grWS/AWD8WUzTryU0UytyvrGS', '081112342134', 'seller', 'approved', '2026-11-17 08:20:42.45422+08', '2026-11-25 18:36:09.221525+08', NULL, NULL);
INSERT INTO public.users (id, full_name, email, password_hash, phone_number, role, seller_status, created_at, updated_at, rejection_reason, rejected_at) VALUES (1, 'Super Admin', 'admin@test.com', '$2b$12$u9.2UP1jVmXUtpj/kIRpYOC3jls.iAnkpiZ21aMZJrsaIGL2khWBW', '081527128355', 'admin', NULL, '2026-11-16 23:20:30.41406+08', '2026-11-25 18:38:03.790091+08', NULL, NULL);
INSERT INTO public.users (id, full_name, email, password_hash, phone_number, role, seller_status, created_at, updated_at, rejection_reason, rejected_at) VALUES (81, 'fayyadhmuwaffaq', 'pembeli@test.com', '$2b$12$BmP1qVp7HkNQAB136YX8zu0SE8UXxsbWciWjp6uDQoCynU6u4L48W', '081625376356', 'buyer', NULL, '2026-11-17 08:26:34.048809+08', '2026-11-19 12:43:36.486667+08', NULL, NULL);
INSERT INTO public.users (id, full_name, email, password_hash, phone_number, role, seller_status, created_at, updated_at, rejection_reason, rejected_at) VALUES (194, 'Pak Gondrong', 'nelayan3@test.com', '$2b$12$.UUL.46ZiAaE/lj28RpUGOOWTrwLeIGJlgrMAWTSNeJctCLbbFIkm', '08123456789', 'seller', 'approved', '2026-11-23 11:30:01.016968+08', '2026-11-23 11:34:46.339113+08', NULL, NULL);
INSERT INTO public.users (id, full_name, email, password_hash, phone_number, role, seller_status, created_at, updated_at, rejection_reason, rejected_at) VALUES (180, 'Juragan Udang', 'nelayan2@test.com', '$2b$12$Qz07LhFcAnJV9/4Q41PJ/OVzQ2RMKkxJrv99c53sjCTGTl1J/a7Hm', '08123456789', 'seller', 'approved', '2026-11-21 06:58:44.910497+08', '2026-11-23 18:56:09.586087+08', NULL, NULL);


--
-- Name: cart_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cart_items_id_seq', 169, true);


--
-- Name: carts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.carts_id_seq', 531, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 20, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_items_id_seq', 80, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_id_seq', 73, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_id_seq', 136, true);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reviews_id_seq', 28, true);


--
-- Name: stores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stores_id_seq', 129, true);


--
-- Name: user_addresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_addresses_id_seq', 21, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 255, true);


--
-- Name: cart_items cart_items_cart_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_product_id_key UNIQUE (cart_id, product_id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_buyer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_buyer_id_key UNIQUE (buyer_id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key UNIQUE (order_code);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_order_item_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_order_item_id_key UNIQUE (order_item_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: stores stores_seller_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_seller_id_key UNIQUE (seller_id);


--
-- Name: user_addresses user_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT user_addresses_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_orders_buyer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_buyer ON public.orders USING btree (buyer_id);


--
-- Name: idx_orders_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_store ON public.orders USING btree (store_id);


--
-- Name: idx_products_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_active ON public.products USING btree (is_active);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- Name: idx_products_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_name ON public.products USING btree (name);


--
-- Name: idx_products_price; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_price ON public.products USING btree (price_per_kg);


--
-- Name: idx_reviews_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_product ON public.reviews USING btree (product_id);


--
-- Name: idx_users_role_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role_status ON public.users USING btree (role, seller_status);


--
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: carts carts_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: orders orders_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: orders orders_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE RESTRICT;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;


--
-- Name: products products_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: stores stores_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_addresses user_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT user_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

-- Pastikan search_path kembali ke public untuk kueri interaktif
SELECT pg_catalog.set_config('search_path', 'public', false);
